module.exports = {
  // converts key/values to URI/URL params
  renderParamsForUri: function(searchParamsAsJson) {
    var uriParamString = '?';
    for (var key in searchParamsAsJson) {
      if (uriParamString !== '') {
        uriParamString += '&';
      }
      uriParamString += key + '=' + encodeURIComponent(searchParamsAsJson[key]);
    }
    return uriParamString;
  }

};
