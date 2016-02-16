'use strict';

(function() {

  var app = angular.module('domang', ['ui-leaflet', 'geolocation']);

  app.controller('MapController', ['$scope', '$http', '$timeout', 'leafletMapEvents', 'geolocation', function($scope, $http, $timeout, leafletMapEvents, geolocation) {

    var local_icons = {
      default_icon: {},
      brown_bus_stop_icon: {
        iconUrl: '/icons/brown/busstop.png',
        iconSize: [32, 37],
        iconAnchor: [16, 34],
      },
      blue_bus_stop_icon: {
        iconUrl: '/icons/blue/busstop.png',
        iconSize: [32, 37],
        iconAnchor: [16, 34]
      },
      brown_cycling_icon: {
        iconUrl: '/icons/brown/cycling.png',
        iconSize: [32, 37],
        iconAnchor: [16, 34]
      },
      blue_cycling_icon: {
        iconUrl: '/icons/blue/cycling.png',
        iconSize: [32, 37],
        iconAnchor: [16, 34]
      }
    };

    var lastKnownUserLocation = { // this doesn't seem to speed things up on startup
      lat: null,
      lng: null
    };

    this.centerOnUserLocation = function() {
      geolocation.getLocation().then(function(data) {
        if ($scope.center.lat != data.coords.latitude ||
        $scope.center.lng != data.coords.longitude) {
          $scope.center.lat = data.coords.latitude;
          $scope.center.lng = data.coords.longitude;
        }
        $scope.lastKnownUserLocation = {
          lat: data.coords.latitude,
          lng: data.coords.longitude
        };
      });
    };

    this.centerOnUserLocation();

    angular.extend($scope, {
      center: { // default to U.S. Capitol
        lat: lastKnownUserLocation.lat || 38.889931,
        lng: lastKnownUserLocation.lng || -77.009003,
        zoom: 17
      },
      defaults: {
        scrollWheelZoom: false
      },
      events: {
        markers: {
          enable: ['click'],
          logic: 'emit'
        }
      },
      icons: local_icons,
      markers: {},
      paths: {}
    });

    this.places = {
      pentagon: { lat: 38.8690011, lng: -77.0544217 },
      mcPhersonSq: { lat: 38.9020327, lng: -77.0339576 },
      farragutSq: { lat: 38.9019, lng: -77.0390 },
      unionStation: { lat: 38.8973, lng: -77.0063 },
      dupontCir: { lat: 38.9096, lng: -77.0434 },
      loganCir: { lat: 38.909643, lng: -77.029595 },
      shaw: { lat: 38.9111, lng: -77.0219 },
      columbiaHeights: { lat: 38.9250, lng: -77.0300 },
      silverSpring: { lat: 38.9937, lng: -77.03198 },
      takoma: { lat: 38.974837, lng: -77.017509 }
    };

    var map = this;
    $scope.selectedBusStops = {};
    $scope.routes = [];

    $scope.filterLatLngsToMap = function(latlngs) {
      return latlngs.filter(function(latlng) {
        try {
        return geolib.getDistance(
          { latitude: $scope.center.lat, longitude: $scope.center.lng },
          { latitude: latlng.lat, longitude: latlng.lng }
        ) < 500;
      } catch(e) {
        console.log(e, 'latlng:', latlng, 'center:', $scope.center.lat, $scope.center.lng);
      }
      });
    };

    $scope.refreshActiveBusRoutes = function() {
      var keys = Object.keys($scope.selectedBusStops);
      var routes = [];
      $scope.paths = {};
      for (let i = 0; i < keys.length; i++) {
        let stop = $scope.selectedBusStops[keys[i]];
        for (let j = 0; j < stop.active_routes.length; j++) {
          let routeId = stop.active_routes[j];
          if (routes.indexOf(routeId) === -1) {
            routes.push(routeId);
            $http({
              method: 'GET',
              url: '/path/' + routeId
            }).then(function successfulCallback(response) {
              if (response.data.error) console.log('Error:', response.data.error);
              else {
                $scope.paths[routeId + 'a'] = {
                  message: routeId,
                  color: 'cyan',
                  weight: 18,
                  opacity: 0.3,
                  latlngs: $scope.filterLatLngsToMap(response.data[0])
                };
                if (response.data[1]) {
                  $scope.paths[routeId + 'b'] = {
                    message: routeId,
                    color: 'cyan',
                    weight: 18,
                    opacity: 0.3,
                    latlngs: $scope.filterLatLngsToMap(response.data[1])
                  };
                }
              }
            }, function errorCallback(response) {
              console.log('Error getting bus predictions:', response);
            });
          }//if
        }//for
      }//for
    };

    $scope.$watchCollection('selectedBusStops', function(newStops, oldStops, z) {
      $scope.refreshActiveBusRoutes();
    });

    this.updateTimer = undefined; // for metering down updates to no more than once/second

    $scope.selectBusStop = function(busStopId) {
      $http({
        method: 'GET',
        url: '/stop/' + busStopId
      }).then(function successfulCallback(response) {
        if (response.data.error) console.log('Error:', response.data.error);
        else {
          // console.log(response.data);
          $scope.selectedBusStops[busStopId] = response.data;
          // TODO optionally active_routes could be calculated and added here clientside
        }
      }, function errorCallback(response) {
        console.log('Error getting bus predictions:', response);
      });
    };

    $scope.deselectBusStop = function(busStopId) {
      delete $scope.selectedBusStops[busStopId];
      $scope.markers[busStopId].icon = local_icons.brown_bus_stop_icon;
    };

    // return geolib.getDistance(
    //   { latitude: $scope.center.lat, longitude: $scope.center.lng },
    //   { latitude: latlng.lat, longitude: latlng.lng }
    // ) < 500;

    $scope.updateMarkers = function() {
      let keys = Object.keys($scope.markers);
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        // check if marker does not belong to selected bus stops
        // and is outside the map
        if (!(key in $scope.selectedBusStops) && (geolib.getDistance(
          { latitude: $scope.center.lat, longitude: $scope.center.lng },
          { latitude: $scope.markers[key].lat, longitude: $scope.markers[key].lng }
        ) > 600)) { // if so, delete it
          delete $scope.markers[key];
        }
      }
    }

    this.recenterMap = function() {
      console.log('Map recentered.');
      if (!angular.isDefined(map.updateTimer)) {
        map.updateTimer = $timeout(function() {
          console.log('Fetching bus stops');
          map.getNearbyBusStops();
          map.getNearbyCabiStations();
          $scope.refreshActiveBusRoutes();
          $scope.updateMarkers();
          map.updateTimer = undefined;
        }, 1000);
      }
    };

    $scope.$on('leafletDirectiveMarker.click', function(e, args) {
      // Args will contain the marker name and other relevant information
      $scope.markers[args.modelName].display = !$scope.markers[args.modelName].display;
      if ($scope.markers[args.modelName].display) {
        if ($scope.markers[args.modelName].icon == local_icons.brown_bus_stop_icon) {
          $scope.markers[args.modelName].icon = local_icons.blue_bus_stop_icon;
          $scope.selectBusStop(args.modelName);
        } else { // if bicycling
          $scope.markers[args.modelName].icon = local_icons.blue_cycling_icon;
        }
      } else {
        if ($scope.markers[args.modelName].icon == local_icons.blue_bus_stop_icon) {
          $scope.markers[args.modelName].icon = local_icons.brown_bus_stop_icon;
          $scope.deselectBusStop(args.modelName);
        } else { // if bicycling
          $scope.markers[args.modelName].icon = local_icons.brown_cycling_icon;
        }

      }
      // map.getRoutes();
    });

    $scope.$watch('paths', this.drawPaths);

    $scope.$watch('center.lat || center.lng', this.recenterMap);

    $scope.addBusPath = function(routeId, latLngs) {
      console.log('Adding', routeId);
      $scope.paths[routeId] = {
        color: '#008000',
        weight: 8,
        latlngs: latLngs
      };
    };

    $scope.clearMarkers = function() {
      $scope.markers = {};
    };

    $scope.removeStopMarker = function(stopId) {
      delete $scope.markers[stopId];
    };

    $scope.addStopMarker = function(stop) {
      $scope.markers[stop.StopID] = {
        lat: stop.Lat,
        lng: stop.Lon,
        title: stop.Name,
        routes: stop.Routes,
        stopId: stop.StopID,
        display: false,
        draggable: false,
        clickable: true,
        keyboard: true,
        riseOnHover: true,
        icon: local_icons.brown_bus_stop_icon,
        events: {}
      };

      // setTimeout(function() { // FIXME this causes way too many API calls to WMATA and locks up the markers till finished - not good
      //   $http({
      //     method: 'GET',
      //     url: '/stop/' + stop.StopID
      //   }).then(function successfulCallback(response) {
      //     if (response.data.error) console.log('Error:', response.data.error);
      //     else {
      //       console.log(response.data);
      //       // $scope.selectedBusStops[busStopId] = response.data;
      //     }
      //   }, function errorCallback(response) {
      //     console.log('Error getting bus predictions:', response);
      //   });
      // }, 200);
    };

    $scope.addCabiMarker = function(data) {
      $scope.markers[data.id[0]] = {
        lat: parseFloat(data.lat[0]),
        lng: parseFloat(data.long[0]),
        title: data.name[0],
        nbBikes: data.nbBikes[0],
        nbEmptyDocks: data.nbEmptyDocks[0],
        cabiId: data.id[0],
        installed: data.installed[0],
        temporary: data.temporary[0],
        public: data.public[0],
        display: false,
        draggable: false,
        clickable: true,
        keyboard: true,
        riseOnHover: true,
        icon: local_icons.brown_cycling_icon,
        events: {}
      }
    };

    this.getNearbyBusStops = function() {
      $http({
        method: 'GET',
        url: '/stops/' + $scope.center.lat + '/' + $scope.center.lng + '/600/'
      }).then(function successfulCallback(response) {
        for (var i = 0; i < response.data.length; i++) {
          // console.log('YAY:', response.data[i]);
          var busStopData = response.data[i];
          // busStopData.display = false;
          // $scope.busStops.push(busStopData);
          $scope.addStopMarker(busStopData);
        }
      }, function errorCallback(response) {
        console.log('Error getting nearby bus stops:', response);
      });
    },

    this.getNearbyCabiStations = function() {
      $http({
        method: 'GET',
        url: '/cabi/' + $scope.center.lat + '/' + $scope.center.lng
      }).then(function successfulCallback(response) {
        if (response.data.error) console.log('Error getting cabi stations', response.data.error);
        else {
          for (let i = 0; i < response.data.length; i++) {
            $scope.addCabiMarker(response.data[i]);
          }
        }
      });
    };

    this.goTo = function(place) {
      $scope.center.lat = this.places[place].lat;
      $scope.center.lng = this.places[place].lng;
    };

    this.goToLocation = function(lat, lng) {
      $scope.center.lat = lat;
      $scope.center.lng = lng;
    };

  }]);

  app.directive('busStop', function() {
    return {
      restrict: 'E',
      templateUrl: 'bus_stop.html'
    };
  });


})();
