const mongoose = require('mongoose');

if (process.argv.length !== 3 && process.argv.length !== 5) {
    console.log(
        'Error: You provided an incorrect number of arguments!\n' +
        'To see all phonebook entries, provide a password like this:\n' +
        '    node mongo.js <password>\n' +
        'To add a new phonebook entry, provide password and data like this:\n' +
        '    node mongo.js <password> <name> <number>'
    );
    process.exit(1);
}

const password = process.argv[2];

const url = `mongodb+srv://leon:${password}@tutorial.5xqls.mongodb.net/` +
    `phonebook?retryWrites=true&w=majority`;

mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
});

const entrySchema = new mongoose.Schema({
    name: String,
    number: String
});

const Entry = mongoose.model('Entry', entrySchema);

if (process.argv.length == 3) {

    (async function() {
        const allEntries = await Entry.find({});
        console.log('phonebook:');
        allEntries.forEach(entry => {
            console.log(`${entry.name} ${entry.number}`);
        });
        mongoose.connection.close();
    })();
    
} else if (process.argv.length == 5) {

    (async function() {
        const entry = new Entry({ 
            name: process.argv[3], 
            number: process.argv[4] 
        });
        const savedEntry = await entry.save();

        console.log(
            `added ${savedEntry.name} number ${savedEntry.number} to phonebook`
        );
        mongoose.connection.close();
    })();
}
