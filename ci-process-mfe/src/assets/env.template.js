(function (window) {
  window.env = window.env || {};
  // Environment variables
  window['env']['local'] = false;
  window['env']['baseUrl'] = '${BASE_URL}';
  window['env']['authIssuer'] = '${AUTH_ISSUER}';
  window['env']['authClientId'] = '${AUTH_CLIENT_ID}';
  window['env']['production'] = '${PRODUCTION}';
  window['env']['experimental-flag'] = '${EXPERIMENTAL_FLAG}';
})(this);
