'use strict';

let TIME_LIVE = parseInt(process.env.ADMIN_MESHI_SESSION_TIME_LIVE) || (24 * 60 * 60 * 1000); // 24 hours

module.exports = {
  parse: {
    serverURL: "https://ec1810.glitch.me/api",
    appId: process.env.APP_ID,
    masterKey: process.env.MASTER_KEY,
    javascriptKey: process.env.PARSE_SERVER_JAVASCRIPT_KEY
  }
};
