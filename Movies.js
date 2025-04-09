var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect(process.env.DB);

// Movie schema
var MovieSchema = new Schema({
    title: { type: String, required: true },
    releaseDate: Number,
    genre: String,
    actors: [
        {
            actorName: String,
            characterName: String
        }
    ]
});

// return the model
module.exports = mongoose.model('Movie', MovieSchema);