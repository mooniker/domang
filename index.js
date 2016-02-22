var env; // configuration variables
try { // check if local env.js exists for dev server
  env = require('./env');
} catch (localEnvJsNotPresentException) {
  // otherwise use production server's config vars
  env = process.env;
}

var express = require('express');
var path = require('path');
var pathToPublic = path.join(__dirname, 'public');
var pathToLibs = path.join(__dirname, 'bower_components');

var app = express();
var helpers = require('./helpers');

var mongoose = require('mongoose');
var mongoConnection = mongoose.connect(env.MONGO_SERVER_URI);

app.use(express.static(pathToPublic));
app.use('/js', express.static(pathToLibs));

app.get('/ping', function(request, response) {
  response.json({ body: 'pong' });
});

// early dev/testing vars FIXME by deleting when unneeded
var places = {
  pentagon: { lat: 38.8690011, lng: -77.0544217 },
  mcPhersonSq: { lat: 38.9020327, lng: -77.0339576 },
  farragutSq: { lat: 38.9019, lng: -77.0390 },
  unionStation: { lat: 38.8973, lng: -77.0063 },
  dupontCir: { lat: 38.9096, lng: -77.0434 },
  loganCir: { lat: 38.909643, lng: -77.029595 },
  shaw: { lat: 38.9111, lng: -77.0219 },
  columbiaHeights: { lat: 38.9250, lng: -77.0300 },
  silverSpring: { lat: 39.0042, lng: -77.0190 },
  takoma: { lat: 38.974837, lng: -77.017509 }
};

var wmata = require('./wmata'); // WMATA db
var wmataApi = require('./wmata_api');
var cabi = require('./cabi'); // capital bikeshare API

app.get('/bang', function(request, response) {

  // wmataApi.getBusStopsNear(places.mcPhersonSq.lat, places.mcPhersonSq.lng, 500, function(error, json) {
  //   if (error) response.json({ error: error });
  //   else response.json(json);
  // });

  // wmata.getNextBuses('1001185', function(error, json) {
  //   if (error) response.json({ error: error });
  //   else response.json(json);
  // });

  // wmata.getNextBusesNear(pentagonLat, pentagonLon, 500, function(error, json) {
  //   if (error) response.json({ error: error});
  //   else response.json(json);
  // });

  // wmata.getBusPathDetails('7Y', function(error, json) {
  //   if (error) response.json({ error: error });
  //   else response.json(json);
  // });

  // wmata.getBusPosition('29W', pentagonLat, pentagonLon, 10000, function(error, json) {
  //   if (error) response.json({ error: error });
  //   else response.json(json);
  // });

  // wmata.getPathShapesAsLatLngs('18P', function(error, json) {
  //   if (error) response.json({ error: error });
  //   else response.json(json);
  // });

  // wmata.getBusRoutes(function(error, routes) {
  //   if (error) response.json({ error: error });
  //   else response.json(routes);
  // });

  // wmata.getRailStationEntrancesNear(places.mcPhersonSq.lat, places.mcPhersonSq.lng, 500, function(error, json) {
  //   if (error) response.json({ error: error });
  //   else response.json(json);
  // });

  // wmataApi.getRailStationList(function(error, stations) {
  //   if (error) response.json({ error: error });
  //   else response.json(stations);
  // });

  // wmataApi.getRailPredictions(function(error, predictions) {
  //   if (error) response.json({ error: error });
  //   else response.json(predictions);
  // });

  // cabi.getSystemXml(function(error, json) {
  //   if (error) response.json({ error: error });
  //   else response.json(json);
  // });

  cabi.getStationsNear(places.shaw.lat, places.shaw.lng, 500, function(error, stations) {
    if (error) response.json({ error: error });
    else response.json(stations);
  });

});

app.get('/stop/:id', function(request, response) {
  wmata.getNextBuses(request.params.id, function(error, json) {
    if (error) response.json({ error: error });
    else response.json(json);
  });
});

app.get('/nextbus/:lat/:lon/:rad', function(request, response) {
  console.log('Next bus request received:', request.params.lat, request.params.lon, request.params.rad);
  wmata.getNextBusesNear(request.params.lat, request.params.lon, request.params.rad, function(error, json) {
    if (error) {
      response.json({ error: error });
      console.error('ERROR:', error);
    } else response.json(json);
  });
});

app.get('/stops/:lat/:long/:rad', function(request, response) {
  wmataApi.getBusStopsNear(request.params.lat, request.params.long, request.params.rad, function(error, json) {
    if (error) {
      response.json({ error: error });
      console.error('ERROR getting bus stops:', error);
    } else response.json(json);
  });
});

app.get('/entrances/:lat/:long/:rad', function(request, response) {
  wmataApi.getRailStationEntrancesNear(request.params.lat, request.params.long, request.params.rad, function(error, json) {
    if (error) {
      response.json({ error: error });
      console.error('ERROR getting rail station entrances:', error);
    } else response.json(json);
  });
});

app.get('/path/:id', function(request, response) {
  wmata.getPathShapesAsLatLngs(request.params.id, function(error, json) {
    if (error) {
      response.json({ error: error });
      console.error('ERROR getting bus route info:', error);
    } else response.json(json);
  });
});

app.get('/cabi/:lat/:lng', function(request, response) {
  cabi.getNearbyCabiStations(request.params.lat, request.params.lng, function(error, json) {
    if (error) response.json({ error: error });
    else response.json(json);
  });
});

app.get('/station/:code', function(request, response) {
  wmata.getNextTrains(request.params.code, function(error, json) {
    if (error) response.json({ error: error });
    else response.json(json);
  });
});

var port = env.PORT;
app.listen(port, function() {
  console.log('Server up and running on port', port + '.');
});
