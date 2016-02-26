var helpers = require('./helpers');
var Wmata = require('./models/wmata'); // models for WMATA API data cached in db
var wmataApi = require('./wmata_api');
var moment = require('moment');

// var TWO_HOURS = 60 * 60 * 1000 * 2;
var DATA_AGE_LIMIT = 15 * 1000;

module.exports = {

  // getRailStationEntrancesNear: function(lat, lon, radius, callback) {
  //   wmataApi.getRailStationEntrancesNear(lat, lon, radius, function(error, entrances) {
  //     if (error) callback(error);
  //     else {
  //
  //       stations.forEach(function(station) {
  //
  //       });
  //     }
  //   });
  // },

  getNextBuses: function(stopId, callback) {
    console.log('Wmata.getNextBuses checking db for cached data.');
    Wmata.busPredictionsModel.findOne({ StopID: stopId }, function(error, predictions) {
      if (error) callback(error);
      else if (!predictions || Date.now() - predictions.timestamp > DATA_AGE_LIMIT) {
        // console.log('Data is older than', Date.now() - predictions.timestamp, '>', DATA_AGE_LIMIT);
        // console.log('Going to need the WMATA API for this.');
        wmataApi.getNextBuses(stopId, callback, predictions);
      } else {
        // console.log('Date is old?', Date.now() - predictions.timestamp > DATA_AGE_LIMIT);
        // console.log(moment(predictions.timestamp).fromNow());
        // console.log('How old is the data?', Date.now(), '-', predictions.timestamp, '=', Date.now() - predictions.timestamp);
        console.log('Using cached data for bus stop.');
        callback(null, predictions)
      };
    });
  },

  getBusPathDetails: function(routeId, callback) {
    Wmata.busPathModel.findOne({ RouteID: routeId}, function(error, pathDetails) {
      if (error) callback(error);
      else if (!pathDetails || helpers.isNotToday(pathDetails.timestamp)) {
        // if path isn't yet in database or needs update
        wmataApi.getBusPathDetails(routeId, callback, pathDetails);
      } else callback(null, pathDetails); // send back pathDetails from db
    });
  },

  getBusRoutes: function(callback) {
    Wmata.busRouteModel.findOne({}, function(error, routesData) {
      if (error) callback(error);
      else if (!routesData || helpers.isNotToday(routesData.timestamp)) {
        wmataApi.getBusRoutes(callback, routesData);
      } else callback(null, routesData);
    });
  },

  getRailStationList: function(callback) {
    Wmata.railStationModel.findOne({}, function(error, stationsData) {
      if (error) callback(error);
      else if (!stationsData || helpers.isNotToday(stationsData.timestamp)) {
        wmataApi.getRailStationList(callback, stationsData);
      } else callback(null, stationsData);
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

  },

  getRailPredictions: function(callback) {
    Wmata.railPredictionsModel.findOne({}, function(error, predictions) {
      if (error) callback(error);
      else if (!predictions || Date.now() - predictions.timestamp > 1000 * 20) {
        wmataApi.getRailPredictions(callback, predictions);
      } else callback(null, predictions);
    });
  },

  getNextTrains: function(stationCode, callback) {
    this.getRailPredictions(function(error, predictions) {
      if (error) callback(error);
      else {
        var timestamp = predictions.timestamp;
        callback(null, predictions.Trains.filter(function(prediction) {
          return prediction.LocationCode === stationCode;
        }).map(function(prediction) {
          prediction.timestamp = timestamp;
          return prediction;
        }));
      }
    });
  }

};
