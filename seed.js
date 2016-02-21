// var env; // configuration variables
// try { // check if local env.js exists for dev server
//   env = require('./env');
// } catch (localEnvJsNotPresentException) {
//   // otherwise use production server's config vars
//   env = process.env;
// }
// var mongoose = require('mongoose');
// var mongoConnection = mongoose.connect(env.MONGO_SERVER_URI);
// var WmataBusPathModel = require('./models/wmata').busPathModel;
// var wmata = require('./wmata');

// WmataBusPathModel.findOne({ RouteID: '18P'}, function(error, pathDetails) {
//   if (error) console.error(error);
//   else if (!pathDetails) { // if path isn't yet in database
//     console.log('Unrecorded route requested.');
//     new WmataBusPathModel(json).save(function(saveError) {
//       if (saveError) console.error(saveError);
//       else console.log('Route created and saved.');
//     });
//   } else if (pathDetails.timestamp - Date.now() > 60 * 60 * 1000 * 2) {
//     // if pathDetails are more than two hours old
//     // FIXME realstically they only change at midnight ET
//     pathDetails = json;
//     pathDetails.save(function(saveError) {
//       if (saveError) console.error(saveError);
//       else console.log('Route updated.');
//     });
//   } else {
//     console.log('Route already exists and is up to date.');
//   }
//   process.exit();
// });

// wmata.getPathDetails('18P', function(error, json) {
//   if (error) console.error(error);
//   else {
//     console.log('Route fetched:', json);
//     new WmataBusPathModel(json).save(function(saveError) {
//       if (saveError) console.error(saveError);
//       else console.log('Route saved.');
//       process.exit();
//     });
//   }
// });
