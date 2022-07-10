const axios = require("axios");
const fs = require("fs");

const ENV = "./env.json";

const createEnvFileIfNotExists = function () {
  if (!fs.existsSync(ENV)) {
    try {
      fs.writeFileSync(
        ENV,
        JSON.stringify({
          webhook: "",
          port: 8000,
        })
      );
      console.log("Env file created successfully.");
    } catch (err) {
      console.log("Failed to create env file: ", err);
    }
  }
};

const getEnvFile = function () {
  return JSON.parse(fs.readFileSync(ENV));
};

const setEnvFile = function (env) {
  fs.writeFile(ENV, JSON.stringify(env), function (err) {
    if (err) {
      console.log(err);
    }
  });
};

function sendWebhook(message) {
  let env = getEnvFile();
  if (env.webhook) {
    var data = JSON.stringify(message);
    var config = {
      method: "get",
      url: env.webhook,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios(config)
      .then(function (response) {
        // console.log(JSON.stringify(response.data));
        console.log("callback sent")
      })
      .catch(function (error) {
        console.log(error);
      });
  } else {
    console.log("No webhook url in env.json file");
  }
}

function validURL(str) {
  var pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return !!pattern.test(str);
}

module.exports = {
  createEnvFileIfNotExists,
  getEnvFile,
  setEnvFile,
  sendWebhook,
  validURL,
};
