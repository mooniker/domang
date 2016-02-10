'use strict';

(function() {

  var app = angular.module('domang', [
    'ui-leaflet'
  ]);

  app.controller('MapController', ['$scope', '$http', function($scope, $http) {

    var map = this;
    this.busStops = [];

    angular.extend($scope, {
        center: {
          lat: 38.8710,
          lng: -77.0560,
          zoom: 14
        },
        paths: {
          color: 'green',
          opacity: 0.5,
          stroke: false,
          fillColor: 'green',
          weight: 0,
          radius: 10,
          latlngs: [38.8710, -77.0560],
          type: 'circle',
          clickable: false,
          heading: 240
        },
        markers: {
          center: {
            lat: 38.8710,
            lng: -77.0560,
            draggable: false,
            events: {
              enable: ['click'],
              logic: 'emit'
            }
          }
        },
        defaults: {
          scrollWheelZoom: false
        },
        events: {
          map: {
            enable: ['click'],
            logic: 'emit'
          }
        }
    });

    this.center = {
      lat: 38.8710,
      lng: -77.0560,
      zoom: 14
    };

    $scope.$on('leafletDirectiveMap.click', function(event){
      console.log('CLICK:', event);
    });

    this.markBusStops = function() {

      for (var i = 0; i < map.busStops.length; i++) {
        $scope.markers[map.busStops[i]['StopID']] = {
          lat: map.busStops[i]['Lat'],
          lng: map.busStops[i]['Lon'],
          title: map.busStops[i]['StopName'],
          draggable: false,
          clickable: true,
          keyboard: true,
          riseOnHover: true
        };
      }
    }

    this.updateBuses = function() {
      $http({
        method: 'GET',
        url: '/nextbus/' + $scope.center.lat + '/' + $scope.center.lng + '/500/'
      }).then(function successfulCallback(response) {
        map.busStops = response.data;
        console.log(map.busStops);
        map.markBusStops();
      }, function errorCallback(response) {
        console.log('ERROR:', response);
      });
    };

    this.updateLocation = function(lat, lng) {
      $scope.center.lat = lat;
      $scope.center.lng = lng;
    };

    this.setLocationToLondon = function() {
      this.updateLocation(51.5072, -0.1275);
    };

    this.setLocationToPentagon = function() {
      this.updateLocation(38.8710, -77.0560);
    };

    this.addCenterMarker = function() {
      console.log('center!');
      $scope.markers = {
        center: {
          lat: 38.8710,
          lng: -77.0560,
          draggable: false
        }
      };
      $scope.paths = {
        circle: {
          type: 'circle',
          radius: 500,
          latlngs: [$scope.center.lat, $scope.center.lng]
        }
      };
      console.log($scope.paths);
    }

  }]);

  app.directive('busStop', function() {
    return {
      restrict: 'E',
      templateUrl: 'bus_stop.html'
    };
  });


})();
