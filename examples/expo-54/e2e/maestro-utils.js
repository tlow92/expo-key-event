/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const utils = {
  sendKeyEvent: (keyCode, platform) => {
    const url = `http://localhost:3000/send-key-event?keyCode=${keyCode}&platform=${platform}`;
    return http.get(url);
  }
};

output.utils = utils;
