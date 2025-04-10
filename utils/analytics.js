const rp = require('request-promise');
const crypto = require('crypto');

const GA_TRACKING_ID = process.env.GA_TRACKING_ID;

function trackReviewEvent(movieTitle) {
    const clientId = crypto.randomBytes(16).toString("hex");

    const options = {
        method: 'GET',
        uri: 'https://www.google-analytics.com/collect',
        qs: {
            v: '1', // API version
            tid: GA_TRACKING_ID,
            cid: clientId,
            t: 'event',
            ec: 'Feedback', // Event Category
            ea: 'Rating',   // Event Action
            el: 'API Request for Movie Review', // Event Label
            cd1: movieTitle, // Custom Dimension 1: Movie Title
            cm1: 1           // Custom Metric 1: One review added
        },
        headers: {
            'Cache-Control': 'no-cache'
        }
    };

    return rp(options);
}

module.exports = { trackReviewEvent };