'use strict';

(function() {

  var RAD = 400; // default radius in meters for geolocation searches

  var app = angular.module('domang', ['ui-leaflet', 'geolocation']);

  app.controller('MapController', ['$scope', '$http', '$timeout', 'leafletMapEvents', 'geolocation', function($scope, $http, $timeout, leafletMapEvents, geolocation) {

    var ICON_SIZE = [32, 37],
        ICON_ANCHOR = [16, 34];

    var local_icons = {
      default_icon: {},
      brown_bus_stop_icon: {
        iconUrl: '/icons/brown/busstop.png',
        iconSize: ICON_SIZE,
        iconAnchor: ICON_ANCHOR,
      },
      blue_bus_stop_icon: {
        iconUrl: '/icons/blue/busstop.png',
        iconSize: ICON_SIZE,
        iconAnchor: ICON_ANCHOR
      },
      brown_cycling_icon: {
        iconUrl: '/icons/brown/cycling.png',
        iconSize: ICON_SIZE,
        iconAnchor: ICON_ANCHOR
      },
      blue_cycling_icon: {
        iconUrl: '/icons/blue/cycling.png',
        iconSize: ICON_SIZE,
        iconAnchor: ICON_ANCHOR
      },
      blue_metro_icon: {
        iconUrl: '/icons/blue/underground.png',
        iconSize: ICON_SIZE,
        iconAnchor: ICON_ANCHOR
      },
      brown_metro_icon: {
        iconUrl: '/icons/brown/underground.png',
        iconSize: ICON_SIZE,
        iconAnchor: ICON_ANCHOR
      },
      selected: {
        busStop: {
          iconUrl: '/icons/blue/busstop.png',
          iconSize: ICON_SIZE,
          iconAnchor: ICON_ANCHOR
        },
        metro: {
          iconUrl: '/icons/blue/underground.png',
          iconSize: ICON_SIZE,
          iconAnchor: ICON_ANCHOR
        },
        cabi: {
          iconUrl: '/icons/blue/cycling.png',
          iconSize: ICON_SIZE,
          iconAnchor: ICON_ANCHOR
        },
      },
      unselected: {
        busStop: {
          iconUrl: '/icons/brown/busstop.png',
          iconSize: ICON_SIZE,
          iconAnchor: ICON_ANCHOR
        },
        metro: {
          iconUrl: '/icons/brown/underground.png',
          iconSize: ICON_SIZE,
          iconAnchor: ICON_ANCHOR
        },
        cabi: {
          iconUrl: '/icons/brown/cycling.png',
          iconSize: ICON_SIZE,
          iconAnchor: ICON_ANCHOR
        }
      },
      highlighted: {
        busStop: {
          iconUrl: '/icons/cyan/busstop.png',
          iconSize: ICON_SIZE,
          iconAnchor: ICON_ANCHOR
        },
        metro: {
          iconUrl: '/icons/cyan/underground.png',
          iconSize: ICON_SIZE,
          iconAnchor: ICON_ANCHOR
        },
        cabi: {
          iconUrl: '/icons/cyan/cycling.png',
          iconSize: ICON_SIZE,
          iconAnchor: ICON_ANCHOR
        }
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
          $scope.markers.user = {
            lat: data.coords.latitude,
            lng: data.coords.longitude,
            title: stop.Name,
            display: true,
            draggable: false,
            clickable: true,
            keyboard: true,
            riseOnHover: true,
            // icon: local_icons.brown_bus_stop_icon,
            // events: {}
          }
        }
        $scope.lastKnownUserLocation = {
          lat: data.coords.latitude,
          lng: data.coords.longitude
        };
      });
    };

    this.centerOnUserLocation();

    this.places = [{
      name: 'Columbia Heights', lat: 38.9250, lng: -77.0300
    },{
      name: 'Dupont Circle', lat: 38.9096, lng: -77.0434
    },{
      name: 'Farragut Square', lat: 38.9019, lng: -77.0390
    },{
      name: 'Gallery Place', lat: 38.8981674, lng: -77.021920
    },{
      name: "L'Enfant Plaza", lat: 38.8840, lng: -77.0209
    },{
      name: 'Logan Circle', lat: 38.909643, lng: -77.029595
    },{
      name: 'McPherson Square', lat: 38.9020327, lng: -77.0339576
    },{
      name: 'Metro Center', lat: 38.8983144732, lng: -77.0280779971
    },{
      name: 'Pentagon', lat: 38.8690011, lng: -77.0544217
    },{
      name: 'Shaw', lat: 38.9111, lng: -77.0219
    },{
      name: 'Silver Spring', lat: 38.9937, lng: -77.03198
    },{
      name: 'Takoma', lat: 38.974837, lng: -77.017509
    },{
      name: 'Union Station', lat: 38.8973, lng: -77.0063
    },{
      name: 'U.S. Capitol', lat: 38.889931, lng: -77.009003
    }];

    angular.extend($scope, {
      center: { // default to U.S. Capitol
        lat: lastKnownUserLocation.lat || this.places[1].lat,
        lng: lastKnownUserLocation.lng || this.places[1].lng,
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

    var map = this;
    map.neighborhoodSelector; // used for pulldown menu
    map.selectNeighborhood = function() {
      console.log(map.neighborhoodSelector);
      map.goToLocation(map.neighborhoodSelector.lat, map.neighborhoodSelector.lng);
    };
    $scope.selectedMarkers = [];
    $scope.selectedBusStops = {};
    $scope.unusedMarkers = {};
    $scope.routes = [];
    $scope.railStations = {};

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

    this.drawBusPath = function(routeId) {
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
    };

    this.redrawBusPaths = function() {
      $scope.paths = {};
      for (let i = 0; i < $scope.routes.length; i++) {
        map.drawBusPath($scope.routes[i]);
      }
    };

    $scope.toggleRouteDisplay = function(routeId) {
      console.log(routeId);
      var index = $scope.routes.indexOf(routeId);
      if (index === -1) {
        $scope.routes.push(routeId);
        map.drawBusPath(routeId);
      } else {
        $scope.routes.splice(index, 1);
        map.redrawBusPaths();
      }
    };

    this.updateTimer = undefined; // for metering down updates to no more than once/second

    // $scope.selectBusStop = function(busStopId) {
    //   $http({
    //     method: 'GET',
    //     url: '/stop/' + busStopId
    //   }).then(function successfulCallback(response) {
    //     if (response.data.error) console.log('Error:', response.data.error);
    //     else {
    //       // console.log(response.data);
    //       $scope.selectedBusStops[busStopId] = response.data;
    //       // TODO optionally active_routes could be calculated and added here clientside
    //     }
    //   }, function errorCallback(response) {
    //     console.log('Error getting bus predictions:', response);
    //   });
    // };
    //
    // $scope.deselectBusStop = function(busStopId) {
    //   delete $scope.selectedBusStops[busStopId];
    //   $scope.markers[busStopId].icon = local_icons.brown_bus_stop_icon;
    // };

    $scope.updateBusMarker = function(markerId) {
      $http({
        method: 'GET',
        url: '/stop/' + markerId
      }).then(function successfulCallback(response) {
        if (response.data.error) console.log('Error:', response.data.error);
        else {
          console.log(response.data);
          $scope.markers[markerId].Predictions = response.data.Predictions;
          $scope.markers[markerId].active_routes = response.data.active_routes;
          $scope.markers[markerId].timestamp = response.data.timestamp;
        }
      });
    };

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
          // move it to unused marker collection
          $scope.unusedMarkers[key] = $scope.markers[key];
          // delete it from page
          delete $scope.markers[key];
          // console.log(key, 'moved to unusedMarkers:', $scope.unusedMarkers);
        }
      }
    }

    this.recenterMap = function() {
      console.log('Map recentered, updating map.');
      if (!angular.isDefined(map.updateTimer)) {
        map.updateTimer = $timeout(function() {
          map.getNearbyBusStops();
          map.getNearbyRailStations();
          map.getNearbyCabiStations();
          map.redrawBusPaths();
          $scope.updateMarkers();
          map.updateTimer = undefined;
        }, 1000);
      }
    };

    $scope.toggleMarker = function(markerId) {
      let index = $scope.selectedMarkers.indexOf(markerId);
      if (index === -1) { // toggle on
        // change color
        $scope.markers[markerId].icon = $scope.markers[markerId].selectedIcon;
        $scope.selectedMarkers.push(markerId);
        $scope.markers[markerId].update();
      } else { // toggle off
        // change color
        $scope.markers[markerId].icon = $scope.markers[markerId].unselectedIcon;
        // remove from selected array
        $scope.selectedMarkers.splice(index, 1);
      }
      console.log('Selected markers:', $scope.selectedMarkers);
    };

    $scope.$on('leafletDirectiveMarker.click', function(e, args) {
      // Args will contain the marker name and other relevant information
      // $scope.markers[args.modelName].display = !$scope.markers[args.modelName].display;
      // if ($scope.markers[args.modelName].display) {
      //   if ($scope.markers[args.modelName].icon == local_icons.brown_bus_stop_icon) {
      //     $scope.markers[args.modelName].icon = local_icons.blue_bus_stop_icon;
      //     $scope.selectBusStop(args.modelName);
      //   } else if ($scope.markers[args.modelName].icon == local_icons.brown_cycling_icon) { // if bicycling
      //     $scope.markers[args.modelName].icon = local_icons.blue_cycling_icon;
      //   } else { // if metro
      //     $scope.markers[args.modelName].icon = local_icons.blue_metro_icon;
      //   }
      // } else {
      //   if ($scope.markers[args.modelName].icon == local_icons.blue_bus_stop_icon) {
      //     $scope.markers[args.modelName].icon = local_icons.brown_bus_stop_icon;
      //     $scope.deselectBusStop(args.modelName);
      //   } else if ($scope.markers[args.modelName].icon == local_icons.blue_cycling_icon) { // if bicycling
      //     $scope.markers[args.modelName].icon = local_icons.brown_cycling_icon;
      //   } else { // if metro
      //     $scope.markers[args.modelName].icon = local_icons.brown_metro_icon;
      //   }
      // }
      $scope.markers[args.modelName].selected = !$scope.markers[args.modelName].selected;
      $scope.toggleMarker(args.modelName);
    });

    $scope.$watch('paths', this.drawPaths);

    $scope.$watch('center.lat || center.lng', this.recenterMap);

    $scope.addBusPath = function(routeId, latLngs) {
      // console.log('Adding', routeId);
      $scope.paths[routeId] = {
        color: '#008000',
        weight: 8,
        latlngs: latLngs
      };
    };

    // $scope.clearMarkers = function() {
    //   $scope.markers = {};
    // };
    //
    // $scope.removeStopMarker = function(stopId) {
    //   delete $scope.markers[stopId];
    // };

    $scope.addStopMarker = function(stop) {
      if ($scope.markers[stop.StopID]) {
        // already got his bus stop on screen
      } else {
        $scope.markers[stop.StopID] = {
          lat: stop.Lat,
          lng: stop.Lon,
          title: stop.Name,
          routes: stop.Routes,
          stopId: stop.StopID,
          display: false,
          selected: $scope.selectedMarkers.indexOf(stop.StopID) > -1,
          draggable: false,
          clickable: true,
          keyboard: true,
          riseOnHover: true,
          icon: local_icons.brown_bus_stop_icon,
          selectedIcon: local_icons.selected.busStop,
          unselectedIcon: local_icons.unselected.busStop,
          highlightedIcon: local_icons.highlighted.busStop,
          update: function() {
            $scope.updateBusMarker(this.stopId);
          },
          events: {}
        };
        // add in data from unusedMarker if it exists, then delete it
      }

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

    $scope.addEntranceMarker = function(data) {
      // console.log('Adding rail station entrance marker:', data);
      $scope.markers[data.Name] = {
        lat: data.Lat,
        lng: data.Lon,
        title: data.Name,
        message: data.Description,
        StationCode1: data.StationCode1,
        StationCode2: data.StationCode2,
        StationName1: data.StationName1,
        StationName2: data.StationName2,
        Description: data.Description,
        display: false,
        selected: $scope.selectedMarkers.indexOf(data.Name) > -1,
        draggable: false,
        clickable: true,
        keyboard: true,
        riseOnHover: true,
        icon: local_icons.brown_metro_icon,
        selectedIcon: local_icons.selected.metro,
        unselectedIcon: local_icons.unselected.metro,
        highlightedIcon: local_icons.highlighted.metro,
        events: {}
      };
      // add in data from unusedMarker if it exists, then delete it
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
        selected: $scope.selectedMarkers.indexOf(data.id[0]) > -1,
        draggable: false,
        clickable: true,
        keyboard: true,
        riseOnHover: true,
        icon: local_icons.brown_cycling_icon,
        selectedIcon: local_icons.selected.cabi,
        unselectedIcon: local_icons.unselected.cabi,
        highlightedIcon: local_icons.highlighted.cabi,
        events: {}
      };
      // add in data from unusedMarker if it exists, then delete it
    };

    this.getNearbyBusStops = function() {
      $http({
        method: 'GET',
        url: '/stops/' + $scope.center.lat + '/' + $scope.center.lng + '/' + RAD + '/'
      }).then(function successfulCallback(response) {
        for (var i = 0; i < response.data.length; i++) {
          var busStopData = response.data[i];
          // console.log(busStopData);
          $scope.addStopMarker(busStopData);
        }
      }, function errorCallback(response) {
        console.log('Error getting nearby bus stops:', response);
      });
    };

    this.getNearbyRailStations = function() {
      // console.log('Getting rail stations');
      $http({
        method: 'GET',
        url: '/entrances/' + $scope.center.lat + '/' + $scope.center.lng + '/' + RAD
      }).then(function successfulCallback(response) {
        for (let i = 0; i < response.data.length; i++) {
          var entrance = response.data[i];
          $scope.addEntranceMarker(entrance);
        }
      });
    };

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

    // this.goTo = function(place) {
    //   $scope.center.lat = this.places[place].lat;
    //   $scope.center.lng = this.places[place].lng;
    // };

    this.goToLocation = function(lat, lng) {
      $scope.center.lat = lat;
      $scope.center.lng = lng;
      console.log('go to', lat, lng);
    };

  }]);

  app.directive('busStop', function() {
    return {
      restrict: 'E',
      templateUrl: 'bus_stop.html'
    };
  });

  app.directive('transitOption', function() {
    return {
      restrict: 'E',
      templateUrl: 'transit_option.html'
    };
  });

})();
