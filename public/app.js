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
      markers: {}
    });

    // $scope.icons.local_icons = {
    //   default_icon: {},
    //   brown_bus_stop_icon: {
    //
    //   },
    //   blue_bus_stop_icon: {
    //
    //   }
    // };

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

    // $scope.eventDetected = "No events yet...";
    // var mapEvents = leafletMapEvents.getAvailableMapEvents();
    // for (var k in mapEvents){
    //   var eventName = 'leafletDirectiveMap.' + mapEvents[k];
    //   $scope.$on(eventName, function(event){
    //     $scope.eventDetected = event.name;
    //     // console.log(event.name);
    //   });
    // }

    $scope.$on('leafletDirectiveMarker.click', function(e, args) {
      // Args will contain the marker name and other relevant information
      $scope.markers[args.modelName].display = !$scope.markers[args.modelName].display;
      if ($scope.markers[args.modelName].display) $scope.markers[args.modelName].icon = local_icons.blue_bus_stop_icon;
      else $scope.markers[args.modelName].icon = local_icons.brown_bus_stop_icon;
    });

    var map = this;
    this.updateTimer = undefined; // for metering down updates to no more than once/second

    this.recenterMap = function() {
      console.log('Map recentered.');
      if (!angular.isDefined(map.updateTimer)) {
        map.updateTimer = $timeout(function() {
          console.log('Fetching bus stops');
          map.getNearbyBusStops();
          map.updateTimer = undefined;
        }, 1000);
      }
    };

    $scope.$watch('center.lat || center.lng', this.recenterMap);
    // $scope.busStops = [];
    // $scope.busStopData = {};
    // $scope.busStopData = [];

    // angular.extend($scope, {
    //   markers: {}
    // });

    $scope.addBusPath = function(routeId, latLngs) {
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

    // $scope.$watchCollection('busStops', function() {
    //   // filter local bus stops data by proximity to map center
    //   var stops = $scope.busStops.filter(function(stop) {
    //     return geolib.getDistance({
    //       latitude: $scope.center.lat, longitude: $scope.center.lng
    //     },{
    //       latitude: stop.Lat, longitude: stop.Lon
    //     }) < 1000;
    //   });
    //   $scope.clearMarkers();
    //   for (var i = 0; i < stops.length; i++) {
    //     $scope.addStopMarker(stops[i].StopID, stops[i].Lat, stops[i].Lon, stops[i].Name, stops[i].Routes);
    //   }
    // });

    this.getNearbyBusStops = function() {
      $http({ // FIXME can we meter this out so the call doesn't go out more than once a second
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
