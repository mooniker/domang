'use strict';

(function() {

  var app = angular.module('domang', ['ui-leaflet']);

  app.controller('MapController', ['$scope', '$http', 'leafletMapEvents', function($scope, $http, leafletMapEvents) {

    $scope.center = {
      lat: 38.8710,
      lng: -77.0560,
      zoom: 16
    };

    $scope.eventDetected = "No events yet...";
    var mapEvents = leafletMapEvents.getAvailableMapEvents();
    for (var k in mapEvents){
      var eventName = 'leafletDirectiveMap.' + mapEvents[k];
      $scope.$on(eventName, function(event){
          $scope.eventDetected = event.name;
          // console.log(event.name);
      });
    }

    function centerChange() {
      map.updateNearbyBusStops();
    }

    $scope.$watch('center.lat', centerChange);
    $scope.$watch('center.lng', centerChange);

    angular.extend($scope, {
      markers: {}
    });

    $scope.addStopMarker = function(stopId, lat, lng, stopName) {
      $scope.markers[stopId] = {
        lat: lat,
        lng, lng,
        title: stopName,
        draggable: false,
        clickable: true,
        keyboard: true,
        riseOnHover: true
      }
    }

    $scope.clearMarkers = function() {
      $scope.markers = {};
    };

    $scope.busStopData = {};

    var map = this;
    this.busStops = [];

    this.markBusStops = function() {

      for (var busStopId in $scope.busStopData) {
        if (geolib.getDistance({
          latitude: $scope.center.lat,
          longitude: $scope.center.lng
        },{
          latitude: $scope.busStopData[busStopId]['Lat'],
          longitude: $scope.busStopData[busStopId]['Lon']
        }) > 1000 ) {
          if ($scope.markers[busStopId]) {
            delete $scope.markers[busStopId];
          }
          delete $scope.busStopData[busStopId];
        } else {
          $scope.addStopMarker(
            busStopId,
            $scope.busStopData[busStopId]['Lat'],
            $scope.busStopData[busStopId]['Lon'],
            $scope.busStopData[busStopId]['StopName']
          );
        }
      }

    };

    this.updateNearbyBusStops = function() {
      $http({
        method: 'GET',
        url: '/nextbus/' + $scope.center.lat + '/' + $scope.center.lng + '/1000/'
      }).then(function successfulCallback(response) {
        // map.busStops = response.data;
        // map.markBusStops();
        for (var i = 0; i < response.data.length; i++) {
          $scope.busStopData[response.data[i]['StopID']] = response.data[i];
        }
        map.markBusStops();
      }, function errorCallback(response) {
        console.log('ERROR:', response);
      });
    };

    this.goToLocation = function(lat, lng) {
      $scope.center.lat = lat;
      $scope.center.lng = lng;
    };

    this.setLocationToLondon = function() {
      this.goToLocation(51.5072, -0.1275);
    };

    this.setLocationToPentagon = function() {
      this.goToLocation(38.8710, -77.0560);
    };

  }]);

  app.directive('busStop', function() {
    return {
      restrict: 'E',
      templateUrl: 'bus_stop.html'
    };
  });


})();
