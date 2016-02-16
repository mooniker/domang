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

module.exports = {
  busPathModel: mongoose.model('WmataBusPath', WmataBusPathSchema),
  busPredictionsModel: mongoose.model('WmataBusPredictions', WmataBusPredictionsSchema),
  busRouteModel: mongoose.model('WmataBusRoute', WmataBusRouteSchema)
  // lineModel: mongoose.model('WmataLine'),
  // stationModel: mongoose.model('WmataStation'),
  // elevatorIncidentModel: mongoose.model('WmataElevatorIncident'),
  // railIncidentModel: mongoose.model('WmataRailIncident')
};
