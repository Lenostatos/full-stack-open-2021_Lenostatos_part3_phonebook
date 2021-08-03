require('dotenv').config();

const process = require('process');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Entry = require('./models/entry');

const app = express();

app.use(cors());
app.use(express.static('build'));
app.use('/api', express.json());

// Set up logging with morgan using the tiny configuration
app.use(morgan('tiny'));

// Create a custom morgan token for displaying the request body
morgan.token('request-body', request => JSON.stringify(request.body));
// Log only the body of post requests
app.post('*', morgan('request body: :request-body'));

app.get('/info', async (request, response) => {
   const entryCount = await Entry.countDocuments({});
   const currentDate = new Date();
   response.send(`
        <p>The phonebook has ${entryCount} entries.</p>
        <p>${currentDate.toDateString()} ${currentDate.toTimeString()}</p>
    `);
});

// Get all entries
app.get('/api/persons', async (request, response) => {
   const entries = await Entry.find({});
   response.json(entries);
});

// Post a new entry
app.post('/api/persons', async (request, response, next) => {
   const requestBody = request.body;

   const postedEntry = new Entry({
      name: requestBody.name,
      number: requestBody.number
   });

   try {
      const savedEntry = await postedEntry.save();
      response.json(savedEntry);
   } catch (error) {
      console.log('error while saving a new entry');
      next(error);
   }
});

// Handle requests around single, existing entries
app.route('/api/persons/:id')
   .get(async (request, response, next) => {

      let requestedEntry;
      try {
         requestedEntry = await Entry.findById(request.params.id);
      } catch (error) {
         console.log('error while searching for an entry by id');
         next(error);
      }

      if (requestedEntry) {
         response.json(requestedEntry);
      } else {
         response.status(404).end();
      }
   })
   .put(async (request, response, next) => {

      try {
         // mongoose recommends doing updates as follows instead of using,
         // e.g. findByIdAndUpdate:
         // https://mongoosejs.com/docs/documents.html#updating-using-queries
         const entryOnServer = await Entry.findById(request.params.id);
         // only ever update the number
         entryOnServer.number = request.body.number;
         const updatedEntryOnServer = await entryOnServer.save();
         response.json(updatedEntryOnServer);
      } catch (error) {
         console.log('error while updating an entry');
         next(error);
      }
   })
   .delete(async (request, response) => {
      try {
         await Entry.findByIdAndDelete(request.params.id);
      } catch (error) {
         console.log('error while deleting an entry:', error);
      }

      response.status(204).end();
   });

app.use((request, response) => {
   response.status(404).send({ error: 'unknown endpoint' });
});

function errorHandler(error, request, response, next) {
   console.error(error);

   if (error.name === 'CastError') {
      return response.status(400).send({ error: 'malformed id' });
   }

   if (error.name === 'ValidationError') {
      return response.status(400).json({ error: error.message });
   }

   next(error);
}

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}...`);
});
