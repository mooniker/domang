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
// var WmataBusPathModel = require('./models/wmata').busPathModel;
// var WmataBusPredictionsModel = require('./models').busPredictionsModel;
var Wmata = require('./models/wmata'); // models for WMATA API data cached in db

var TWO_HOURS = 60 * 60 * 1000 * 2;

var wmataApi = { // WMATA API calls

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
  }
};

module.exports = {

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

  getNextBuses: function(stopId, callback) {
    Wmata.busPredictionsModel.findOne({ StopID: stopId }, function(error, predictions) {
      if (error) callback(error);
      else if (!predictions || Date.now() - predictions.updated_at > 10000) { // 10 seconds
        wmataApi.getNextBuses(stopId, callback, predictions);
      } else callback(null, predictions);
    });
  },

  getBusPathDetails: function(routeId, callback) {
    Wmata.busPathModel.findOne({ RouteID: routeId}, function(error, pathDetails) {
      if (error) callback(error);
      else if (!pathDetails || Date.now() - pathDetails.updated_at > TWO_HOURS) {
        // if path isn't yet in database or needs update
        wmataApi.getBusPathDetails(routeId, callback, pathDetails);
      } else callback(null, pathDetails); // send back pathDetails from db
    });
  },

  getBusRoutes: function(callback) {
    Wmata.busRouteModel.findOne({}, function(error, routesData) {
      if (error) callback(error);
      else if (!routesData || Date.now() - routesData.updated_at > TWO_HOURS) {
        wmataApi.getBusRoutes(callback, routesData);
      } else callback(null, routesData);
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

  getPathShapesAsLatLngs: function(routeId, callback) {

    this.getBusPathDetails(routeId, function(error, pathDetails) {

      if (error) callback(error);
      else {

        function convertShapeToLatLngs(shape) {
          return shape.map(function(seg) { return { lat: seg.Lat, lng: seg.Lon }; });
        }

        if (pathDetails.Direction0) {
          var dir0path = convertShapeToLatLngs(pathDetails.Direction0.Shape);
        }
        if (pathDetails.Direction1) {
          var dir1path = convertShapeToLatLngs(pathDetails.Direction1.Shape);
        }

        callback(null, [dir0path, dir1path || null]);
      }

    });

  }

};
