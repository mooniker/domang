'use strict';

var env; // configuration variables
try { // check if local env.js exists for dev server
  env = require('./env');
} catch (localEnvJsNotPresentException) {
  // otherwise use production server's config vars
  env = process.env;
}

var request = require('request');
var helpers = require('./helpers');

module.exports = {

  getStopIdsNear: function(lat, lon, radius, callback) {
    // WMATA JSON stop search
    // https://developer.wmata.com/docs/services/54763629281d83086473f231/operations/5476362a281d830c946a3d6d
    var requestUrl = 'https://api.wmata.com/Bus.svc/json/jStops';
    var url = requestUrl + helpers.renderParamsForUri({
      Lat: lat,
      Lon: lon,
      Radius: 500, // meters
      api_key: env.WMATA_KEY
    });
    request(url, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var stops = JSON.parse(body)['Stops'].filter(function(stop) {
          return stop['StopID'] != 0; // aparently some StopIds are 0
        });
        callback(null, stops);
      } else callback(error || error || response.statusCode);
    });
  },

  getNextBuses: function(stopId, callback) {
    // WMATA real-time bus predictions
    // https://developer.wmata.com/docs/services/5476365e031f590f38092508/operations/5476365e031f5909e4fe331d
    var requestUrl = 'https://api.wmata.com/NextBusService.svc/json/jPredictions';
    var url = requestUrl + helpers.renderParamsForUri({
      StopID: stopId,
      api_key: env.WMATA_KEY
    });
    request(url, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        callback(null, JSON.parse(body));
      } else {
        callback(error || response.statusCode);
      }
    });
  },

  getPathDetails: function(routeId, callback) {
    // WMATA bus path details
    // https://developer.wmata.com/docs/services/54763629281d83086473f231/operations/5476362a281d830c946a3d69
    var requestUrl = 'https://api.wmata.com/Bus.svc/json/jRouteDetails';
    var url = requestUrl + helpers.renderParamsForUri({
      RouteID: routeId,
      api_key: env.WMATA_KEY
    });
    request(url, function(error, response, body) {
      if (!error && response.statusCode === 200) callback(null, JSON.parse(body));
      else callback(error || response.statusCode);
    });
  },

  getBusPosition: function(routeId, lat, lon, radius, callback) {
    // WMATA bus position
    // https://developer.wmata.com/docs/services/54763629281d83086473f231/operations/5476362a281d830c946a3d68
    var requestUrl = 'https://api.wmata.com/Bus.svc/json/jBusPositions';
    var url = requestUrl + helpers.renderParamsForUri({
      RouteID: routeId,
      Lat: lat,
      Lon: lon,
      Radius: radius,
      api_key: env.WMATA_KEY
    });
    request(url, function(error, response, body) {
      if (!error && response.statusCode === 200) callback(null, JSON.parse(body));
      else callback(error || response.statusCode);
    })
  },

  getNextBusesNear: function(lat, lon, radius, callback) {
    this.getStopIdsNear(lat, lon, radius, function(error, stops) {
      if (error) callback(error);
      else {
        var count = stops.length;
        var predictions = [];
        for (let i = 0; i < stops.length; i++) {
          this.getNextBuses(stops[i]['StopID'], function(error, json) {
            count--;
            if (error) console.error(error);
            if (json) {
              json['StopID'] = stops[i]['StopID'];
              json['Lon'] = stops[i]['Lon'];
              json['Lat'] = stops[i]['Lat'];
              predictions.push(json);
            }
            if (count <= 0) callback(null, predictions);
          });
        }
      }
    }.bind(this));
  }

};
