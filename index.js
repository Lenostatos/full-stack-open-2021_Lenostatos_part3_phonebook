require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Entry = require('./models/entry');

/**
 * Indicates whether an object is emtpy, i.e. equivalent to {}.
 * 
 * Implementation based on https://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object/59787784#59787784
 */
function isEmpty(obj) {
    for (prop in obj) { return false; }
    return obj.constructor === Object;
}

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
app.post('/api/persons', async (request, response) => {
    const requestBody = request.body;

    if (!requestBody.name) {
        return response.status(400).json({ 
            error: 'posted a phonebook entry without a name'
        });
    }
    if (!requestBody.number) {
        return response.status(400).json({ 
            error: 'posted a phonebook entry without a number'
        });
    }

    // if (persons.some(person => person.name === requestBody.name)) {
    //     return response.status(400).json({
    //         error: `posted a phonebook entry with the name ${requestBody.name} ` +
    //                `but there is already an entry with that name in the ` +
    //                `phonebook`
    //     });
    // }
    
    const postedEntry = new Entry({
        name: requestBody.name,
        number: requestBody.number
    });

    const savedEntry = await postedEntry.save();

    response.json(savedEntry);
});

// Handle requests around single, existing entries
app.route('/api/persons/:id')
    .get(async (request, response, next) => {

        let requestedEntry;
        try {
            requestedEntry = await Entry.findById(request.params.id);
        } catch (error) {
            console.log('error while getting an entry:', error);
            next(error);
        }

        if (requestedEntry) {
            response.json(requestedEntry);
        } else {
            response.status(404).end();
        }
    })
    .put(async (request, response, next) => {
        const requestBody = request.body;

        ['id', 'name', 'number'].forEach(property => {
            if (!requestBody[property]) {
                return response.status(400).json({
                    error: 
                    `no ${property} provided with an entry update request`
                });
            }
        });

        const requestedUpdate = {
            name: requestBody.name,
            number: requestBody.number
        };

        try {
            const updatedEntryOnServer = await Entry.findByIdAndUpdate(
                request.params.id,
                requestedUpdate,
                { new: true } // makes findByIdAndUpdate return the updated note 
                // instead of the original one
            );
            response.json(updatedEntryOnServer);
        } catch (error) {
            console.log('error while updating an entry:', error);
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

    next(error);
}

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}...`);
});
