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

    this.recenterMap = function() {
      console.log('Map recentered.');
      if (!angular.isDefined(map.updateTimer)) {
        map.updateTimer = $timeout(function() {
          console.log('Fetching bus stops');
          map.getNearbyBusStops();
          // map.getPaths();
          map.updateTimer = undefined;
        }, 1000);
      }
    };

    $scope.$on('leafletDirectiveMarker.click', function(e, args) {
      // Args will contain the marker name and other relevant information
      $scope.markers[args.modelName].display = !$scope.markers[args.modelName].display;
      if ($scope.markers[args.modelName].display) $scope.markers[args.modelName].icon = local_icons.blue_bus_stop_icon;
      else $scope.markers[args.modelName].icon = local_icons.brown_bus_stop_icon;
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
    };

    this.getNearbyBusStops = function() {
      $http({
        method: 'GET',
        url: '/stops/' + $scope.center.lat + '/' + $scope.center.lng + '/800/'
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
