# Domang

_Domang_ (pronounced "doh mahng") is a web app that shows nearby bus stop locations and arrival times in Washington, D.C., on a map in the web browser. The Node.js/Express backend draws on the [WMATA API](https://developer.wmata.com/) and caches some bus data in Mongo for performance reasons. An Angular frontend renders the map with Leaflet using the [AngularUI Leaflet module](http://angular-ui.github.io/ui-leaflet/).
