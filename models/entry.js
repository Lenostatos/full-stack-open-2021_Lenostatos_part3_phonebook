const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const url = process.env.MONGODB_URI;

console.log('connecting to', url);

(async function() {
    try {
        await mongoose.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        });
        console.log('connected to MongoDB');
    } catch (error) {
        console.log('error connecting to MongoDB:', error.message);
    }
})();

const entrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 3,
        unique: true
    },
    number: {
        type: String,
        minLength: 8,
        required: true
    }
});

entrySchema.plugin(uniqueValidator);

entrySchema.set('toJSON', {
  transform: (document, convertedDocument) => {
    convertedDocument.id = convertedDocument._id.toString();
    delete convertedDocument._id;
    delete convertedDocument.__v;
    return convertedDocument;
  }
});

module.exports = mongoose.model('Entry', entrySchema);
