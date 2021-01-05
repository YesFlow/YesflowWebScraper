const functions = require('firebase-functions');
const admin = require('firebase-admin');

const {imageServer} = require('./server');

const parseImages = functions.https.onRequest((request, response) => {
  if (!request.path) {
    request.url = `/${request.url}`; // Prepend '/' to keep query params if any
  }
  return imageServer(request, response);
});

module.exports = {
  parseImages
};