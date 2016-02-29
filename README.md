# Domang (aka "Getaway")

_Domang_ (pronounced "doh mahng," which means _getaway_ or _escape_) is an experimental MEAN web app that shows nearby real-time transit and some route options based on geolocation in the Washington, D.C., metropolitan area. The Node.js/Express backend draws on the the [Washington Metropolitan Area Transit Authority's (WMATA) API](https://developer.wmata.com/) for data and caches some bus data in a Mongo database to reduce the number of calls required on the WMATA API. An Angular frontend renders the map with Leaflet using the [AngularUI Leaflet module/directive](http://angular-ui.github.io/ui-leaflet/).

Domang is a work very much in progress.

## Demo your Getaway

See the demo at [http://getaway.mooniker.com](http://getaway.mooniker.com).

## Credit where credit is due

Map marker icons used on this app's map are supplied by [Map Icons Collection](https://mapicons.mapsmarker.com/) under [the Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0) license](http://creativecommons.org/licenses/by-sa/3.0/).

## APIs

- [Arlington Transit (GTFS)](http://www.arlingtontransit.com/pages/rider-tools/tools-for-developers/)
- [WMATA](https://developer.wmata.com/)
