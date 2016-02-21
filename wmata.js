var helpers = require('./helpers');
var Wmata = require('./models/wmata'); // models for WMATA API data cached in db
var wmataApi = require('./wmata_api');

var TWO_HOURS = 60 * 60 * 1000 * 2;

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

  getRailStationList: function(callback) {
    Wmata.railStationModel.findOne({}, function(error, stationsData) {
      if (error) callback(error);
      else if (!stationsData || Date.now() - statinosData.updated_at > TWO_HOURS) {
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
      else if (!predictions || Date.now() - predictions.timestamp > 1000 * 15) {
        wmataApi.getRailPredictions(callback, predictions);
      } else callback(null, predictions);
    });
  }

};
