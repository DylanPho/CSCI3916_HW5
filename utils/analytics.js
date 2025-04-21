const rp = require('request-promise');
const GA_TRACKING_ID = process.env.GA_TRACKING_ID;

function trackAnalytics(category, action, label, value, dimension, metric) {
  const options = {
    method: 'GET',
    uri: 'https://www.google-analytics.com/collect',
    qs: {
      v: '1',
      tid: GA_TRACKING_ID,
      cid: Math.floor(Math.random() * 1000000000),
      t: 'event',
      ec: category,
      ea: action,
      el: label,
      ev: value,
      cd1: dimension,
      cm1: metric,
    },
    headers: {
      'Cache-Control': 'no-cache'
    }
  };

  return rp(options);
}
module.exports = { trackAnalytics };
