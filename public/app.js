'use strict';

(function() {

  var app = angular.module('domang', ['ui-leaflet']);

  app.controller('MapController', ['$scope', '$http', 'leafletMapEvents', function($scope, $http, leafletMapEvents) {

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
      }
    });

    var local_icons = {
      default_icon: {},
      brown_bus_stop_icon: {
        iconUrl: '/icons/brown/busstop.png',
        iconSize: [32, 37],
        iconAnchor: [16, 1],
      },
      blue_bus_stop_icon: {
        iconUrl: '/icons/blue/busstop.png',
        iconSize: [32, 37],
        iconAnchor: [16, 1]
      }
    };

    $scope.icons = local_icons;

    $scope.eventDetected = "No events yet...";
    var mapEvents = leafletMapEvents.getAvailableMapEvents();
    for (var k in mapEvents){
      var eventName = 'leafletDirectiveMap.' + mapEvents[k];
      $scope.$on(eventName, function(event){
        $scope.eventDetected = event.name;
        // console.log(event.name);
      });
    }

    $scope.$on('leafletDirectiveMarker.click', function(e, args) {
      // Args will contain the marker name and other relevant information
      // console.log("Leaflet Click", e, args);
      // make the bus stop display on the dashboard
      $scope.busStopData[args.modelName].display = !$scope.busStopData[args.modelName].display;
      console.log('Toggled bus stop', args.modelName, 'now', $scope.busStopData[args.modelName].display);
      console.log($scope.markers[args.modelName]);
      // $scope.markers[args.modelName].icon = local_icons.blue_bus_stop_icon;
      if ($scope.busStopData[args.modelName].display) {
        $scope.markers[args.modelName].icon = local_icons.blue_bus_stop_icon;
      } else {
        $scope.markers[args.modelName].icon = local_icons.brown_bus_stop_icon;
      }
    });

    function recenterMap() {
      map.updateNearbyBusStops();
    }

    $scope.$watch('center.lat', recenterMap);
    $scope.$watch('center.lng', recenterMap);

    angular.extend($scope, {
      markers: {}
    });

    $scope.addStopMarker = function(stopId, lat, lng, stopName) {
      $scope.markers[stopId] = {
        lat: lat,
        lng: lng,
        title: stopName,
        draggable: false,
        clickable: true,
        keyboard: true,
        riseOnHover: true,
        // message: stopName,
        icon: local_icons.brown_bus_stop_icon,
        events: {}
      };
    };

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

    $scope.busStopData = {};
    // $scope.busStopData = [];

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
          var data = response.data[i];
          data.display = false;
          console.log(data);
          $scope.busStopData[response.data[i]['StopID']] = data; // if busStopData were a hash
          // $scope.busStopData.push(data); // if busStopData were an array
        }
        map.markBusStops();
      }, function errorCallback(response) {
        console.log('ERROR:', response);
      });
    };

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
      }
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
