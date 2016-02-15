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
app.use('/libs', express.static(pathToLibs));

app.get('/ping', function(request, response) {
  response.json({ body: 'pong' });
});

// early dev/testing vars FIXME by deleting when unneeded
var pentagonLat = 38.8710;
var pentagonLon = -77.0560;
var wmata = require('./wmata');

app.get('/pentagon', function(request, response) {
  response.json({ lat: pentagonLat, lon: pentagonLon });
});

app.get('/bang', function(request, response) {

  // wmata.getStopIdsNear(pentagonLat, pentagonLon, 500, function(error, json) {
  //   if (error) response.json({ error: error });
  //   else {
  //     response.json(json);
  //   }
  // });

  wmata.getNextBuses('1001185', function(error, json) {
    if (error) response.json({ error: error });
    else {
      response.json(json);
    }
  });

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
  wmata.getBusStopsNear(request.params.lat, request.params.long, request.params.rad, function(error, json) {
    if (error) {
      response.json({ error: error });
      console.error('ERROR getting bus stops:', error);
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

var port = env.PORT;
app.listen(port, function() {
  console.log('Server up and running on port', port + '.');
});
