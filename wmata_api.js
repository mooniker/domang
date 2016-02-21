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
var Wmata = require('./models/wmata'); // models for WMATA API data cached in db

module.exports = { // WMATA API calls

  getBusStopsNear: function(lat, lon, radius, callback) {
    // WMATA JSON stop search
    // https://developer.wmata.com/docs/services/54763629281d83086473f231/operations/5476362a281d830c946a3d6d
    var requestUrl = 'https://api.wmata.com/Bus.svc/json/jStops';
    var url = requestUrl + helpers.renderParamsForUri({
      Lat: lat,
      Lon: lon,
      Radius: radius, // meters
      api_key: env.WMATA_KEY
    });
    request(url, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var stops = JSON.parse(body).Stops.filter(function(stop) {
          return stop.StopID != 0; // aparently some StopIds are 0
        });
        // FIXME should we figure out which routes are active
        // var activeRoutes = [];
        // ???
        // var activeRoutesUnique = ???
        callback(null, stops);
      } else callback(error || 'ERROR: WMATA says ' + response.statusCode);
    });
  },

  getRailStationEntrancesNear: function(lat, lon, radius, callback) {
    // WMATA rail station entrances
    // https://developer.wmata.com/docs/services/5476364f031f590f38092507/operations/5476364f031f5909e4fe330f
    var url = 'https://api.wmata.com/Rail.svc/json/jStationEntrances' +
        helpers.renderParamsForUri({
        Lat: lat,
        Lon: lon,
        Radius: radius, // meters
        api_key: env.WMATA_KEY
      });
    request(url, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var stops = JSON.parse(body).Entrances;
        callback(null, stops);
      } else callback(error || 'ERROR: WMATA says ' + response.statusCode);
    });
  },

  getRailStationEntrances: function(callback) {
    // WMATA rail station entrances ^
    var url = 'https://api.wmata.com/Rail.svc/json/jStationEntrances' +
        helpers.renderParamsForUri({ api_key: env.WMATA_KEY });
    request(url, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var entrances = JSON.parse(body);
        entrances.timestamp = Date.now();
        callback(null, entrances);
        Wmata.railStationEntranceModel.findOneAndUpdate({}, entrances, { upsert: true }, function(err) {
          if (err) console.error(err);
          else console.log('Updated rail entrances in db.');
        })
      } else callback(error || 'ERROR: WMATA says ' + response.statusCode);
    })
  },

  getBusRoutes: function(callback, fallbackRoutes) {
    // WMATA routes
    // https://developer.wmata.com/docs/services/54763629281d83086473f231/operations/5476362a281d830c946a3d6a
    var requestUrl = 'https://api.wmata.com/Bus.svc/json/jRoutes';
    var url = requestUrl + helpers.renderParamsForUri({ api_key: env.WMATA_KEY });
    request(url, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var routesJson = JSON.parse(body);
        routesJson.updated_at = Date.now();
        callback(null, routesJson);
        Wmata.busRouteModel.findOneAndUpdate({}, routesJson, { upsert: true }, function(err) {
          if (err) console.error(err);
          else console.log('Updated bus routes in db.');
        });
      } else if (fallbackRoutes) { // use old route data as fallback (if available)
        callback(null, fallbackRoutes);
        console.error(error || 'ERROR: WMATA says ' + response.statusCode + '.');
      } else callback(error || 'ERROR: WMATA says ' + response.statusCode + '.');
    });
  },

  getBusPathDetails: function(routeId, callback, fallbackPathDetails) {
    // WMATA bus path details
    // https://developer.wmata.com/docs/services/54763629281d83086473f231/operations/5476362a281d830c946a3d69
    var requestUrl = 'https://api.wmata.com/Bus.svc/json/jRouteDetails';
    var url = requestUrl + helpers.renderParamsForUri({
      RouteID: routeId,
      api_key: env.WMATA_KEY
    });
    request(url, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var routeJson = JSON.parse(body);
        routeJson.updated_at = Date.now();
        callback(null, routeJson);
        // after passing on new data, save the data in the db for the future
        Wmata.busPathModel.findOneAndUpdate({ RouteID: routeId }, routeJson, { upsert: true }, function(err, doc) {
          if (err) console.error(err);
          else console.log('Route updated in db.');
        });
      } else if (fallbackPathDetails) { // fallback if API call fails
        callback(null, fallbackPathDetails);
        console.error(error || 'ERROR: WMATA says ' + response.statusCode + '.');
      } else callback(error || 'ERROR: WMATA says ' + response.statusCode + '.');
    });
  },

  getNextBuses: function(stopId, callback, predictions) {
    // WMATA real-time bus predictions
    // https://developer.wmata.com/docs/services/5476365e031f590f38092508/operations/5476365e031f5909e4fe331d
    var requestUrl = 'https://api.wmata.com/NextBusService.svc/json/jPredictions';
    var url = requestUrl + helpers.renderParamsForUri({
      StopID: stopId,
      api_key: env.WMATA_KEY
    });
    request(url, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var predictionsJson = JSON.parse(body);
        predictionsJson.updated_at = Date.now();
        predictionsJson.StopID = stopId;
        // add in buses that are actually coming soon, could be moved to client-side?
        var activeRoutes = predictionsJson.Predictions.sort(function(prediction) {
          return prediction.Minutes; // sort by time arriving
        }).map(function(prediction) {
          return prediction.RouteID;
        });
        var activeRoutesUnique = activeRoutes.filter(function(elem, pos) {
          return activeRoutes.indexOf(elem) === pos;
        });
        predictionsJson.active_routes = activeRoutesUnique;
        callback(null, predictionsJson);
        Wmata.busPredictionsModel.findOneAndUpdate({ StopID: stopId }, predictionsJson, { upsert: true }, function(err) {
          if (err) console.error(err);
          else console.log('Updated bus predictions for ' + stopId + ' in db.');
        });
      } else if (predictions) { // use old predictions as fallback
        callback(null, predictions);
        console.error(error || 'ERROR: WMATA says ' + response.statusCode + '.');
      } else callback(error || 'ERROR: WMATA says ' + response.statusCode + '.');
    });
  },

  getBusRoutes: function(callback, fallbackRoutes) {
    // WMATA routes
    // https://developer.wmata.com/docs/services/54763629281d83086473f231/operations/5476362a281d830c946a3d6a
    var requestUrl = 'https://api.wmata.com/Bus.svc/json/jRoutes';
    var url = requestUrl + helpers.renderParamsForUri({ api_key: env.WMATA_KEY });
    request(url, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var routesJson = JSON.parse(body);
        var updatedAt = Date.now();
        routesJson.updated_at = updatedAt;
        callback(null, routesJson);
        Wmata.busRouteModel.findOneAndUpdate({}, routesJson, { upsert: true }, function(err) {
          if (err) console.error(err);
          else console.log('Updated bus routes in db.');
        });
      } else if (fallbackRoutes) { // use old route data as fallback (if available)
        callback(null, fallbackRoutes);
        console.error(error || 'ERROR: WMATA says ' + response.statusCode + '.');
      } else callback(error || 'ERROR: WMATA says ' + response.statusCode + '.');
    });
  },

  getAllBusStops: function(callback) {
    // could get all the routes and store them in db
    // not sure why that might be useful, maybe not
  },

  getRailStationEntrances: function(callback, fallbackEntrances) {
    // WMATA rail station entrances
    // https://developer.wmata.com/docs/services/5476364f031f590f38092507/operations/5476364f031f5909e4fe330f
    var url = 'https://api.wmata.com/Rail.svc/json/jStationEntrances' +
      helpers.renderParamsForUri({ api_key: env.WMATA_KEY });
    request(url, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        callback(null, body); // we can't send just body because it expects just body to be filtered by laglng/rad
        // TODO here's where we would cache the data in db for future use
        // Wmata.railStationEntranceModel.findOneAndUpdate({} ...)
      } else if (fallbackEntrances) {
        callback(null, fallbackEntrances);
        console.error(error || 'ERROR: WMATA says ' + response.statusCode + '.');
      } else callback(error || 'ERROR: WMATA says ' + response.statusCode + '.');
    });

  },

  getRailStationList: function(callback, fallbackStations) {
    // WMATA rail station info
    // https://developer.wmata.com/docs/services/5476364f031f590f38092507/operations/5476364f031f5909e4fe3311
    var url = 'https://api.wmata.com/Rail.svc/json/jStations' +
      helpers.renderParamsForUri({ api_key: env.WMATA_KEY });
    request(url, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var stations = JSON.parse(body);
        stations.updated_at = Date.now();
        callback(error, stations);
        Wmata.railStationModel.findOneAndUpdate({}, stations, { upsert: true }, function(err) {
          if (err) console.error(err);
          else console.log('Updated rail stations in db.');
        });
        stations.forEach(function(station) {
          // let us the entrances
        })
      } else if (fallbackStations) {
        callback(null, fallbackStations);
        console.error(error || 'ERROR: WMATA says ' + response.statusCode + '.');
      } else callback(error || 'ERROR: WMATA says ' + response.statusCode + '.');
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
    });
  },

  getRailPredictions: function(callback, fallbackPredictions) {
    // WMATA real-time rail predictions
    // https://developer.wmata.com/docs/services/547636a6f9182302184cda78/operations/547636a6f918230da855363f
    var url = 'https://api.wmata.com/StationPrediction.svc/json/GetPrediction/All' +
      helpers.renderParamsForUri({ api_key: env.WMATA_KEY });
    request(url, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var predictions = JSON.parse(body);
        predictions.timestamp = Date.now();
        callback(null, predictions);
        Wmata.railPredictionsModel.findOneAndUpdate({}, predictions, { upsert: true }, function(err) {
          if (err) console.error(err);
          else console.log('Predictions updated in db.');
        })
      } else if (fallbackPredictions) {
        callback(null, fallbackPredictions);
        console.error('Failed to update rail predictions, falling back to old data');
      } else callback(error || 'ERROR: ' + response.statusCode);
    });
  }

};
