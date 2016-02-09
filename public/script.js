var dashboard = {

  lat: null,

  lon: null,

  searchRadius: 500,

  map: null,

  busStops: [],

  markBusStop: function(data) {
    // console.log(data);
    var marker = L.marker([data['Lat'], data['Lon']]).addTo(this.map);
    this.busStops.push(marker);
  },

  markBusStops: function() {

    var request = new XMLHttpRequest();
    var url = '/nextbus/' + this.lat + '/' + this.lon + '/' + this.searchRadius;
    // console.log(url);
    request.open('GET', url, true);

    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        // Success!
        var data = JSON.parse(request.responseText);

        if (data.length < 3 && this.searchRadius < 1500 ) {
          this.searchRadius += 500;
          this.markBusStops();
        } else {
          for (var i = 0; i < data.length; i++) {
            this.markBusStop(data[i]);
          }
        }
      } else {
        // We reached our target server, but it returned an error
        console.log('Server failed to comply with request.');
      }
    }.bind(this);

    request.onerror = function() {
      // There was a connection error of some sort
      console.log('Connection error of some sort.');
    };

    request.send();

  },

  renderMap: function() {
    this.map = L.map('map').setView([this.lat, this.lon], 15);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox.streets', // 'mapbox.pirates'
      accessToken: 'pk.eyJ1IjoibW9vbmlrZXIiLCJhIjoiY2loNHkwMmUwMHp1Znc5bTVxZGptZ3d1eSJ9.IjtdkC-4egUXjw39mKShgA'
    }).addTo(this.map);

    var marker = L.marker([this.lat, this.lon]).addTo(this.map);
    var circle = L.circle([this.lat, this.lon], this.searchRadius, {
        color: 'green',
        fillColor: 'green',
        fillOpacity: 0.2
    }).addTo(this.map);

    this.markBusStops();
  },

  init: function() {
    var request = new XMLHttpRequest();
    request.open('GET', '/pentagon', true);

    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        // Success!
        var data = JSON.parse(request.responseText);
        this.lat = data.lat;
        this.lon = data.lon;
        this.renderMap();
      } else {
        // We reached our target server, but it returned an error
        console.log('Server failed to comply with request.');
      }
    }.bind(this);

    request.onerror = function() {
      // There was a connection error of some sort
      console.log('connection error of some sort');
    };

    request.send();
  }
};

dashboard.init();
