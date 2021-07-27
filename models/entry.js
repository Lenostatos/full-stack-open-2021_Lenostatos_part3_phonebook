const mongoose = require('mongoose');

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
    name: String,
    number: String
});

entrySchema.set('toJSON', {
  transform: (document, convertedDocument) => {
    convertedDocument.id = convertedDocument._id.toString();
    delete convertedDocument._id;
    delete convertedDocument.__v;
    return convertedDocument;
  }
});

module.exports = mongoose.model('Entry', entrySchema);
