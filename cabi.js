var cabi = require('node-capital-bikeshare');

module.exports = {

  getAllCabiStations: function(callback) {
    cabi.getAll(function(error, data) {
      if (error) callback(error);
      else callback(null, data);
    });
  },

  getNearbyCabiStations: function(lat, lng, callback) {
    cabi.getByClosest({ latitude: parseFloat(lat), longitude: parseFloat(lng) }, 5, function(error, data) {
      if (error) callback(error);
      else callback(null, data);
    });
  }
};

// example data:
// [ { id: [ '193' ],
//     name: [ '15th & K St NW' ],
//     terminalName: [ '31254' ],
//     lastCommWithServer: [ '1455631778703' ],
//     lat: [ '38.902' ],
//     long: [ '-77.03353' ],
//     installed: [ 'true' ],
//     locked: [ 'true' ],
//     installDate: [ '0' ],
//     removalDate: [ '' ],
//     temporary: [ 'false' ],
//     public: [ 'true' ],
//     nbBikes: [ '0' ],
//     nbEmptyDocks: [ '23' ],
//     latestUpdateTime: [ '1455616917957' ],
//     distance: '37.270' },
//   { id: [ '348' ],
//     name: [ '15th & L St NW' ],
