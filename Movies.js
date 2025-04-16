var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect(process.env.DB);

// Movie schema
const MovieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    releaseDate: {
      type: Number,
      required: true,
      min: [1900, 'Must be after 1899'],
      max: [2100, 'Must be before 2100']
    },
    genre: {
      type: String,
      required: true,
      enum: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Thriller', 'Western', 'Science Fiction']
    },
    actors: {
      type: [{
        actorName: String,
        characterName: String
      }],
      required: [true, 'Actors field is required']
    },
    imageUrl: {
      type: String,
      required: false // can set to true if mandatory
    }
});

// return the model
module.exports = mongoose.model('Movie', MovieSchema);
