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
morgan.token('req-body', req => JSON.stringify(req.body));
// Log only the body of post requests
app.post('*', morgan('request body: :req-body'));

let persons = [
    { 
        "id": 1,
        "name": "Arto Hellas", 
        "number": "040-123456"
    },
    { 
        "id": 2,
        "name": "Ada Lovelace", 
        "number": "39-44-5323523"
    },
    { 
        "id": 3,
        "name": "Dan Abramov", 
        "number": "12-43-234345"
    },
    { 
        "id": 4,
        "name": "Mary Poppendieck", 
        "number": "39-23-6423122"
    }
];

app.get('/info', (req, res) => {
    const currentDate = new Date();
    res.send(`
        <p>The phonebook has ${persons.length} entries.</p>
        <p>${currentDate.toDateString()} ${currentDate.toTimeString()}</p>
    `);
});

// Get all entries
app.get('/api/persons', async (req, res) => {
    const entries = await Entry.find({});
    res.json(entries);
});

// Post a new entry
app.post('/api/persons', async (req, res) => {
    const reqBody = req.body;

    if (!reqBody.name) {
        return res.status(400).json({ 
            error: 'posted a phonebook entry without a name'
        });
    }
    if (!reqBody.number) {
        return res.status(400).json({ 
            error: 'posted a phonebook entry without a number'
        });
    }

    // if (persons.some(person => person.name === reqBody.name)) {
    //     return res.status(400).json({
    //         error: `posted a phonebook entry with the name ${reqBody.name} ` +
    //                `but there is already an entry with that name in the ` +
    //                `phonebook`
    //     });
    // }
    
    const postedEntry = new Entry({
        name: reqBody.name,
        number: reqBody.number
    });

    const savedEntry = await postedEntry.save();

    res.json(savedEntry);
});

// Handle requests around single, existing entries
app.route('/api/persons/:id')
    .get(async (req, res) => {

        let requestedEntry;
        try {
            requestedEntry = await Entry.findById(req.params.id);
        } catch (error) {
            console.log('error with finding an entry:', error);
            res.status(404).end();
        }

        if (requestedEntry) {
            res.json(requestedEntry);
        } else {
            res.status(404).end();
        }
    })
    .put((req, res) => {

    })
    .delete(async(req, res) => {
        try {
            await Entry.findByIdAndDelete(req.params.id);
        } catch (error) {
            console.log('error deleting an entry:', error);
        }

        res.status(204).end();
    });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}...`);
});
