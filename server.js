/*
CSC3916 HW4
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) return res.send(err);
    
        if (!user) {
            return res.status(401).send({ success: false, msg: 'Authentication failed. User not found.' });
        }
    
        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            } else {
                res.status(401).send({ success: false, msg: 'Authentication failed. Wrong password.' });
            }
        });
    });    
});

router.post('/movies', authJwtController.isAuthenticated, function (req, res) {
    var movie = new Movie(req.body);
    movie.save(function (err, result) {
        if (err) res.status(400).json({ success: false, message: err });
        else res.status(201).json({ success: true, message: 'Movie saved!', movie: result });
    });
});

router.get('/movies', authJwtController.isAuthenticated, function (req, res) {
    if (req.query.reviews === 'true') {
        // Join movies with reviews
        Movie.aggregate([
            {
                $lookup: {
                    from: 'reviews',             // MongoDB collection name (lowercase)
                    localField: '_id',           // Movie's _id
                    foreignField: 'movieId',     // Review's movieId
                    as: 'reviews'                // output array
                }
            }
        ]).exec(function (err, results) {
            if (err) res.status(500).json({ success: false, message: err });
            else res.status(200).json({ success: true, data: results });
        });
    } else {
        // Default: return all movies
        Movie.find(function (err, movies) {
            if (err) res.status(400).json({ success: false, message: err });
            else res.status(200).json({ success: true, data: movies });
        });
    }
});

router.get('/movies/:title', authJwtController.isAuthenticated, function (req, res) {
    const title = req.params.title;

    if (req.query.reviews === 'true') {
        // Return movie + reviews (aggregation)
        Movie.aggregate([
            { $match: { title: title } },
            {
                $lookup: {
                    from: 'reviews', // collection name
                    localField: '_id',
                    foreignField: 'movieId',
                    as: 'reviews'
                }
            }
        ]).exec(function (err, result) {
            if (err) res.status(500).json({ success: false, message: err });
            else if (!result || result.length === 0) res.status(404).json({ success: false, message: 'Movie not found' });
            else res.status(200).json({ success: true, data: result[0] });
        });
    } else {
        // Return movie only (no reviews)
        Movie.findOne({ title: title }, function (err, movie) {
            if (err) res.status(500).json({ success: false, message: err });
            else if (!movie) res.status(404).json({ success: false, message: 'Movie not found' });
            else res.status(200).json({ success: true, data: movie });
        });
    }
});

router.put('/movies/:title', authJwtController.isAuthenticated, function (req, res) {
    const title = req.params.title;
    const updatedData = req.body;

    Movie.findOneAndUpdate({ title: title }, updatedData, { new: true }, function (err, updatedMovie) {
        if (err) {
            res.status(500).json({ success: false, message: err });
        } else if (!updatedMovie) {
            res.status(404).json({ success: false, message: 'Movie not found' });
        } else {
            res.status(200).json({ success: true, message: 'Movie updated', movie: updatedMovie });
        }
    });
});

router.post('/reviews', authJwtController.isAuthenticated, function (req, res) {
    var review = new Review(req.body);
    review.save(function (err, result) {
        if (err) res.status(400).json({ success: false, message: err });
        else res.status(201).json({ success: true, message: 'Review created!', review: result });
    });
});

router.get('/reviews/:movieId', function (req, res) {
    Review.find({ movieId: req.params.movieId }, function (err, reviews) {
        if (err) res.status(500).json({ success: false, message: err });
        else res.status(200).json(reviews);
    });
});


app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


