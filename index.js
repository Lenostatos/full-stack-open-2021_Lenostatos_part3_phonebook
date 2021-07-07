const express = require('express');
const morgan = require('morgan');

const app = express();

/**
 * Indicates whether an object is emtpy, i.e. equivalent to {}.
 * 
 * Implementation based on https://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object/59787784#59787784
 */
function isEmpty(obj) {
    for (prop in obj) { return false; }
    if (obj.constructor !== Object) { return false; }
    return true;
}

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

// Get all persons
app.get('/api/persons', (req, res) => res.json(persons));

// Post a new person
app.post('/api/persons', (req, res) => {
    const reqBody = req.body;

    if (!reqBody.name) {
        return res.status(400).json({ 
            error: 'posted a person object without a name'
        });
    }
    if (!reqBody.number) {
        return res.status(400).json({ 
            error: 'posted a person object without a number'
        });
    }

    if (persons.some(person => person.name === reqBody.name)) {
        return res.status(400).json({
            error: `posted a person with the name ${reqBody.name} but the ` + 
                'phonebook already has an entry for that name'
        });
    }
    
    const newPerson = {
        id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
        name: reqBody.name,
        number: reqBody.number
    };
    
    persons.push(newPerson);
    res.json(newPerson);
});

// Handle requests around single, existing persons
app.route('/api/persons/:id(\\d+)')
    .get((req, res) => {
        const reqId = Number(req.params.id);
        const reqPerson = persons.find(person => person.id === reqId);

        if (reqPerson) {
            res.json(reqPerson);
        } else {
            res.status(404).end();
        }
    })
    .put((req, res) => {

    })
    .delete((req, res) => {
        const reqId = Number(req.params.id);
        persons = persons.filter(person => person.id !== reqId);

        res.status(204).end();
    });

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}...`);
});
