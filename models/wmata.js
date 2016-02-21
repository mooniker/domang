var mongoose = require('mongoose');

var Schema = mongoose.Schema; //,
    // ObjectId = Schema.ObjectId;

var WmataBusPathSchema = new Schema({
  RouteID: String,
  Name: String,
  Direction0: Schema.Types.Mixed,
  Direction1: Schema.Types.Mixed,
  updated_at: { type: Date, default: Date.now }
});

var WmataBusPredictionsSchema = new Schema({
  Predictions: Array,
  StopName: String,
  active_routes: Array,
  updated_at: { type: Date, default: Date.now }
});

var WmataBusRouteSchema = new Schema({
  RouteID: String,
  Name: String,
  LineDescription: String,
  updated_at: { type: Date, default: Date.now }
});

var WmataRailStationEntranceSchema = new Schema({
  Description: String,
  latlng: { type: [Number], index: '2d' },
  Name: String,
  StationCode1: String,
  StationCode2: String,
  StationName1: String,
  StationName2: String
});

var WmataRailStationSchema = new Schema({
  Address: {
    City: String,
    State: String,
    Street: String,
    Zip: String
  },
  Code: String,
  latlng: { type: [Number], index: '2d' },
  LineCode1: String,
  LineCode2: String,
  LineCode3: String,
  LineCode4: String,
  Name: String,
  StationTogether1: String,
  StationTogether2: String
});

var WmataRailPredictionsSchema = new Schema({
  Trains: Array,
  timestamp: { type: Date, default: Date.now }
});

module.exports = {
  busPathModel: mongoose.model('WmataBusPath', WmataBusPathSchema),
  busPredictionsModel: mongoose.model('WmataBusPredictions', WmataBusPredictionsSchema),
  busRouteModel: mongoose.model('WmataBusRoute', WmataBusRouteSchema),
  railStationEntranceModel: mongoose.model('WmataRailStationEntrance', WmataRailStationEntranceSchema),
  railStationModel: mongoose.model('WmataRailStation', WmataRailStationSchema),
  railPredictionsModel: mongoose.model('WmataRailPredictions', WmataRailPredictionsSchema),
  // railLineModel: mongoose.model('WmataRailLine'),
  // elevatorIncidentModel: mongoose.model('WmataElevatorIncident'),
  // railIncidentModel: mongoose.model('WmataRailIncident')
  stationCodes: require('./station_codes')
};
