const express = require('express');
const { exec } = require('child_process');
const app = express();
const port = 3000;

app.get('/send-key-event', (req, res) => {
  const { keyCode, platform } = req.query;

  if (!keyCode) {
    return res.status(400).send('keyCode query parameter is required');
  }

  if (!platform) {
    return res.status(400).send('platform query parameter is required (ios or android)');
  }

  if (platform.toLowerCase() === 'android') {
    const command = `adb shell input keyevent ${keyCode}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).send(`Error executing ${platform} command: ${error.message}`);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      res.send(`Sent key event ${keyCode} to ${platform}. stdout: ${stdout}`);
    });
  } else if (platform.toLowerCase() === 'ios') {
    // First get the UDID of the booted simulator
    exec('idb list-targets | grep "Booted"', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).send(`Error finding booted simulator: ${error.message}`);
      }

      // Parse UDID from output (format: "Name | UDID | Booted | ...")
      const match = stdout.match(/\|\s*([A-F0-9-]+)\s*\|/);
      if (!match) {
        return res.status(500).send('Could not find UDID of booted simulator');
      }

      const udid = match[1];
      console.log(`Found booted simulator UDID: ${udid}`);

      // Now send the key event
      const command = `idb ui key ${keyCode} --udid ${udid}`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return res.status(500).send(`Error executing idb command: ${error.message}`);
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }
        res.send(`Sent key event ${keyCode} to ${platform}. stdout: ${stdout}`);
      });
    });
  } else {
    return res.status(400).send('platform must be either "ios" or "android"');
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
