/*
CSC3916 HW5
File: Server.js
Description: Web API scaffolding for Movie API
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const bodyParser = require('body-parser');
require('dotenv').config();

const authJwtController = require('./auth_jwt');
const User = require('./Users');
const Movie = require('./Movies');
const Review = require('./Reviews');

const app = express();
const router = express.Router();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());

// MongoDB connection
mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

/* ====== ROUTES ====== */

// SIGNUP
router.post('/signup', function (req, res) {
  const user = new User(req.body);
  user.save(function (err, result) {
    if (err) res.status(400).json({ success: false, message: err });
    else res.status(201).json({ success: true, message: 'User created!', user: result });
  });
});

// SIGNIN
router.post('/signin', function (req, res) {
  const userNew = new User(req.body);
  User.findOne({ username: userNew.username }).select('name username password').exec(function (err, user) {
    if (err) return res.status(500).send(err);
    if (!user) return res.status(401).send({ success: false, msg: 'Authentication failed. User not found.' });

    user.comparePassword(userNew.password, function (isMatch) {
      if (isMatch) {
        const userToken = { id: user.id, username: user.username };
        const token = require('jsonwebtoken').sign(userToken, process.env.SECRET_KEY);
        res.json({ success: true, token: 'JWT ' + token });
      } else {
        res.status(401).send({ success: false, msg: 'Authentication failed. Wrong password.' });
      }
    });
  });
});

/* ====== MOVIES ====== */

// GET all movies or with reviews + avgRating
router.get('/movies', authJwtController.isAuthenticated, function (req, res) {
  if (req.query.reviews === 'true') {
    Movie.aggregate([
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'movieId',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          avgRating: { $avg: '$reviews.rating' }
        }
      },
      {
        $sort: { avgRating: -1 }
      }
    ]).exec(function (err, results) {
      if (err) res.status(500).json({ success: false, message: err });
      else res.status(200).json({ success: true, data: results });
    });
  } else {
    Movie.find(function (err, movies) {
      if (err) res.status(500).json({ success: false, message: err });
      else res.status(200).json({ success: true, data: movies });
    });
  }
});

// GET movie by MongoDB ID with reviews and avgRating (for detail screen)
router.get('/movies/id/:id', authJwtController.isAuthenticated, function (req, res) {
  const movieId = req.params.id;

  Movie.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(movieId) }
    },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'movieId',
        as: 'reviews'
      }
    },
    {
      $addFields: {
        avgRating: { $avg: '$reviews.rating' }
      }
    }
  ]).exec(function (err, result) {
    if (err) res.status(500).json({ success: false, message: err });
    else if (!result || result.length === 0) res.status(404).json({ success: false, message: 'Movie not found' });
    else res.status(200).json({ success: true, data: result[0] });
  });
});

// POST a movie
router.post('/movies', authJwtController.isAuthenticated, function (req, res) {
  const movie = new Movie(req.body);
  movie.save(function (err, result) {
    if (err) res.status(400).json({ success: false, message: err });
    else res.status(201).json({ success: true, message: 'Movie saved!', movie: result });
  });
});

// PUT update a movie by title
router.put('/movies/:title', authJwtController.isAuthenticated, function (req, res) {
  Movie.findOneAndUpdate({ title: req.params.title }, req.body, { new: true }, function (err, movie) {
    if (err) res.status(500).json({ success: false, message: err });
    else if (!movie) res.status(404).json({ success: false, message: 'Movie not found' });
    else res.status(200).json({ success: true, message: 'Movie updated', movie: movie });
  });
});

// DELETE a movie by title
router.delete('/movies/:title', authJwtController.isAuthenticated, function (req, res) {
  Movie.findOneAndDelete({ title: req.params.title }, function (err, movie) {
    if (err) res.status(500).json({ success: false, message: err });
    else if (!movie) res.status(404).json({ success: false, message: 'Movie not found' });
    else res.status(200).json({ success: true, message: 'Movie deleted', movie: movie });
  });
});

/* ====== REVIEWS ====== */

// GET reviews for a movie
router.get('/reviews/:movieId', authJwtController.isAuthenticated, function (req, res) {
  Review.find({ movieId: req.params.movieId }, function (err, reviews) {
    if (err) res.status(500).json({ success: false, message: err });
    else res.status(200).json({ success: true, data: reviews });
  });
});

// POST a review
router.post('/reviews', authJwtController.isAuthenticated, async function (req, res) {
  try {
    const review = new Review(req.body);
    const savedReview = await review.save();
    res.status(201).json({ success: true, message: 'Review created!', review: savedReview });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Mount router
app.use('/', router);

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));