'use strict';

(function() {

  var app = angular.module('domang', [
    'ui-leaflet'
  ]);

  app.controller('MapController', ['$scope', function($scope) {
    // var self = this;
    angular.extend($scope, {
        center: {
          lat: 38.8710,
          lng: -77.0560,
          zoom: 14
        },
        markers: {
          center: {
            lat: 38.8710,
            lng: -77.0560,
            draggable: false
          }
        },
        defaults: {
          scrollWheelZoom: false
        }
    });
  }]);


})();
