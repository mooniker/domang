'use strict';

(function() {

  var app = angular.module('domang', ['ui-leaflet']);

  app.controller('MapController', ['$scope', '$http', '$timeout', 'leafletMapEvents', function($scope, $http, $timeout, leafletMapEvents) {

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
      }
    };

    angular.extend($scope, {
      center: {
        lat: 38.9020327,
        lng: -77.0339576,
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
      pentagon: {
        lat: 38.8690011,
        lng: -77.0544217
      },
      mcPhersonSq: {
        lat: 38.9020327,
        lng: -77.0339576
      },
      farragutSq: {
        lat: 38.9019,
        lng: -77.0390
      },
      unionStation: {
        lat: 38.8973,
        lng: -77.0063
      }
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
        // console.log(e, 'latlng:', latlng[, 'center:', $scope.center.lat, $scope.center.lng);
      }
      });
    };

    $scope.refreshActiveBusRoutes = function() {
      var keys = Object.keys($scope.selectedBusStops);
      var routes = [];
      $scope.paths = {};
      for (let i = 0; i < keys.length; i++) {
        // console.log(newStops[keys[i]]);
        let stop = $scope.selectedBusStops[keys[i]];
        for (let j = 0; j < stop.active_routes.length; j++) {
          let routeId = stop.active_routes[j];
          if (routes.indexOf(routeId) === -1) {
            routes.push(routeId);
            // console.log('Route added:', stop.active_routes[j]);
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

    // $scope.$watchCollection('routes', function(currentRoutes, oldRoutes) {
    //   $scope.paths = {};
    //   for (let i = 0; i < currentRoutes.length; i++) {
    //     $http({
    //       method: 'GET',
    //       url: '/path/' + $scope.routes[i]
    //     }).then(function successfulCallback(response) {
    //       if (response.data.error) console.log('Error:', response.data.error);
    //       else {
    //         $scope.paths[$scope.routes[i]] = {
    //           message: 'hey there',
    //           color: '#008000',
    //           weight: 16,
    //           opacity: 0.5,
    //           latlngs: $scope.filterLatLngsToMap(response.data[0])
    //         };
    //       }
    //     }, function errorCallback(response) {
    //       console.log('Error getting bus predictions:', response);
    //     });
    //   }
    // });

    this.updateTimer = undefined; // for metering down updates to no more than once/second
    // this.routes = [];

    // draw paths is triggered by location change and marker display changes
    // this.getPaths = function() {
    //   $scope.paths = {};
    //   for (var i = 0; i < map.routes.length; i++) {
    //     var routeId = map.routes[i]
    //     $http({
    //       method: 'GET',
    //       url: '/path/' + map.routes[i]
    //     }).then(function successfulCallback(response) {
    //       // console.log(response.data[0]);
    //       // $scope.paths[map.routes[i]] = response.data[0];
    //       $scope.addBusPath(routeId, response.data[0]);
    //       // if (response[1]) $scope.paths[map.routes[i] + '-1'] = response[1];
    //     }, function errorCallback(response) {
    //       console.log('Error getting nearby bus stops:', response);
    //     });
    //   }
    // };

    // this.getRoutes = function() {
    //   console.log('Routes', this.routes)
    //   this.routes = [];
    //   for (var marker in $scope.markers) {
    //     if ($scope.markers[marker].display) {
    //       for (var i = 0; i < $scope.markers[marker].routes.length; i++) {
    //         if (this.routes.indexOf($scope.markers[marker].routes[i] === -1))
    //           this.routes.push($scope.markers[marker].routes[i]);
    //       }
    //     }
    //   }
    //   this.getPaths();
    // };

    // $scope.selectBusStop = function(busStopId) {
    //   $http({
    //     method: 'GET',
    //     url: '/stop/' + busStopId
    //   }).then(function successfulCallback(response) {
    //     if (response.data.error) console.log('ERROR:', response.data.error);
    //     else {
    //       var busStopData = response.data;
    //       // busStopData.stopId = busStopId;
    //       $scope.selectedBusStops.push(busStopData);
    //     }
    //   }, function errorCallback(response) {
    //     console.log('Error getting bus predictions:', response);
    //   });
    // };
    //
    // $scope.deselectBusStop = function(busStopId) {
    //   var target; // FIXME
    //   if ($scope.selectedBusStops.length === 1) $scope.selectedBusStops = [];
    //   for (var i = 0; i < $scope.selectedBusStops.length; i++) {
    //     if ($scope.selectedBusStops[i].StopID === busStopId) target = i;
    //   }
    //   if (target && target > -1) $scope.selectedBusStops.splice(target, 1);
    //   console.log('target:', target);
    // };

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

    // this.test = function() {
    //   console.log($scope.selectedBusStops);
    // };

    this.recenterMap = function() {
      console.log('Map recentered.');
      if (!angular.isDefined(map.updateTimer)) {
        map.updateTimer = $timeout(function() {
          console.log('Fetching bus stops');
          map.getNearbyBusStops();
          $scope.refreshActiveBusRoutes();
          // map.getPaths();
          map.updateTimer = undefined;
        }, 1000);
      }
    };

    $scope.$on('leafletDirectiveMarker.click', function(e, args) {
      // Args will contain the marker name and other relevant information
      $scope.markers[args.modelName].display = !$scope.markers[args.modelName].display;
      if ($scope.markers[args.modelName].display) {
        $scope.markers[args.modelName].icon = local_icons.blue_bus_stop_icon;
        // $scope.selectedBusStops.push(args.modelName);
        $scope.selectBusStop(args.modelName);
      } else {
        $scope.markers[args.modelName].icon = local_icons.brown_bus_stop_icon;
        // var index = $scope.selectedBusStops.indexOf(args.modelName);
        // if (index > -1) $scope.selectedBusStops.splice(index, 1);
        $scope.deselectBusStop(args.modelName);
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
