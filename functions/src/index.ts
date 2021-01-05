const functions = require('firebase-functions');
const admin = require('firebase-admin');
const runtimeOpts = {
  timeoutSeconds: 300,
  memory: '2GB'
}

const {imageServer} = require('./server');

const parseImages = functions
  .region('us-east1')
  .runWith({ memory: '2GB', timeoutSeconds: 120 })
  .https.onRequest((request, response) => {
  if (!request.path) {
    request.url = `/${request.url}`; // Prepend '/' to keep query params if any
  }
  return imageServer(request, response);
});

module.exports = {
  parseImages
};