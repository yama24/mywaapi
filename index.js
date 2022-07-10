const qrterminal = require("qrcode-terminal");
const qrcode = require("qrcode");
const express = require("express");
const http = require("http");
const fileUpload = require("express-fileupload");
const axios = require("axios");
const socketIO = require("socket.io");
const fs = require("fs");
const mime = require("mime-types");
const { phoneNumberFormatter } = require("./formatter");
const { body, validationResult } = require("express-validator");
const {
  Client,
  LocalAuth,
  MessageMedia,
  List,
  Buttons,
  ClientInfo,
} = require("whatsapp-web.js");

const game = require("./game");

const port = process.env.PORT || 8000;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(
  fileUpload({
    debug: false,
  })
);

app.use("/html/assets", express.static(__dirname + "/html/assets"));

app.get("/", (req, res) => {
  res.sendFile("/html/index.html", {
    root: __dirname,
  });
});

const ENV = "./env.json";

const createEnvFileIfNotExists = function () {
  if (!fs.existsSync(ENV)) {
    try {
      fs.writeFileSync(
        ENV,
        JSON.stringify({
          webhook: "",
        })
      );
      console.log("Env file created successfully.");
    } catch (err) {
      console.log("Failed to create env file: ", err);
    }
  }
};
createEnvFileIfNotExists();

const getEnvFile = function () {
  return JSON.parse(fs.readFileSync(ENV));
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
      })
      .catch(function (error) {
        // console.log(error);
      });
  } else {
    console.log("No webhook url in env.json file");
  }
}

const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process", // <- this one doesn't works in Windows
      "--disable-gpu",
    ],
  },
  authStrategy: new LocalAuth(),
});

client.initialize();

io.on("connection", function (socket) {
  socket.emit("message", "Connecting...");

  client.on("change_state", (state) => {
    socket.emit("message", `State changed to ${state}`);
    console.log("State changed to", state);
  });

  client.on("qr", (qr) => {
    console.log("QR RECEIVED", qr);
    qrterminal.generate(qr, { small: true });
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit("qr", url);
      socket.emit("message", "QR Code received, scan please!");
    });
  });

  client.on("ready", () => {
    socket.emit("ready", "Whatsapp is ready!");
    socket.emit("message", "Whatsapp is ready!");
    console.log("READY");
  });

  client.on("authenticated", () => {
    socket.emit("authenticated", "Whatsapp is authenticated!");
    socket.emit("message", "Whatsapp is authenticated!");
    console.log("AUTHENTICATED");
  });

  client.on("auth_failure", function (session) {
    socket.emit("message", "Auth failure, restarting...");
    console.log("AUTH FAILURE");
  });

  client.on("disconnected", (reason) => {
    socket.emit("message", "Whatsapp is disconnected!");
    console.log("DISCONNECTED");
    client.destroy();
    client.initialize();
  });
});

client.on("message", async (message) => {
  if (message.type == "list_response") {
    if (!fs.existsSync("./res.json")) {
      fs.writeFileSync("./res.json", JSON.stringify([]));
    }

    fs.readFile("./res.json", function (err, data) {
      var json = JSON.parse(data);
      json.push(message);
      fs.writeFile("./res.json", JSON.stringify(json), function (err) {
        if (err) throw err;
        console.log("Saved!");
      });
    });
    if (message._data.quotedMsg.list.title) {
      numStr = message._data.quotedMsg.list.title.substr(
        message._data.quotedMsg.list.title.length - 1
      );
      num = parseInt(numStr);

      if (game["jawaban"](client, num, message.from, message.body)) {
        num2 = num + 1;
        if (num2 < 6) {
          game["pertanyaan" + num2](client, message.from);
        } else {
          client.sendMessage(
            message.from,
            "Selamat, anda menang! ☺️🎉🎉\nTerima kasih telah berpartisipasi"
          );
        }
      } else {
        game["pertanyaan" + num](client, message.from);
      }
    }
  }
  if (message.body === "!ping") {
    message.reply("pong"); // mode reply
  } else if (message.body.startsWith("!sendto ")) {
    // Direct send a new message to specific id
    var number = message.body.split(" ")[1];
    var messageIndex = message.body.indexOf(number) + number.length;
    var messageBody = message.body.slice(messageIndex, message.body.length);
    number = number.includes("@c.us") ? number : `${number}@c.us`;
    client.sendMessage(phoneNumberFormatter(number), messageBody);
    message.reply("message sent to " + number);
  } else if (message.body === "!info") {
    let info = client.info;
    client.sendMessage(
      message.from,
      `
        *Connection info*
        User name: ${info.pushname}
        My number: ${info.wid.user}
        Platform: ${info.platform}
      `
    );
  } else if (message.body === "!buttons") {
    client.sendMessage(message.from, "buttons");
    var button = new Buttons(
      "Button body",
      [
        { id: "customId", body: "button1" },
        { body: "button2" },
        { body: "button3" },
        { body: "button4" },
      ],
      "title",
      "footer"
    );
    client.sendMessage(message.from, button);
  } else if (message.body === "!lists") {
    client.sendMessage(message.from, "lists");
    var sections = [
      {
        title: "sectionTitle",
        rows: [
          // { title: "ListItem1", description: "desc" },
          { title: "Ir. Soekarno" },
          { title: "Jend. Soedirman" },
          { title: "Moh. Hatta" },
          { title: "Ya ndak tahu kok tanya saya." },
        ],
      },
    ];
    var list = new List(
      "Siapa nama Presiden Republik Indonesia (test)",
      "Opsi",
      sections,
      "Pertanyaan 1",
      "footer"
    );
    client.sendMessage(message.from, list);
  } else if (message.body === "!game") {
    client.sendMessage(
      message.from,
      `Hi, let's play a game!\nJawab pertanyaan berikut dengan benar ya!`
    );
    game["pertanyaan1"](client, message.from);
  } else if (message.body == "!groups") {
    client.getChats().then((chats) => {
      const groups = chats.filter((chat) => chat.isGroup);

      if (groups.length == 0) {
        message.reply("You have no group yet.");
      } else {
        let replyMsg = "*YOUR GROUPS*\n\n";
        groups.forEach((group, i) => {
          replyMsg += `ID: ${group.id._serialized}\nName: ${group.name}\n\n`;
        });
        replyMsg +=
          "_You can use the group id to send a message to the group._";
        message.reply(replyMsg);
      }
    });
  }
  // Downloading media
  if (message.hasMedia) {
    message.downloadMedia().then((media) => {
      // To better understanding
      // Please look at the console what data we get
      // console.log(media);
      if (media) {
        sendWebhook({
          status: true,
          response: message,
          media: media,
        });
        // // The folder to store: change as you want!
        // // Create if not exists
        // const mediaPath = "./downloaded-media/";

        // if (!fs.existsSync(mediaPath)) {
        //   fs.mkdirSync(mediaPath);
        // }

        // // Get the file extension by mime-type
        // const extension = mime.extension(media.mimetype);

        // // Filename: change as you want!
        // // I will use the time for this example
        // // Why not use media.filename? Because the value is not certain exists
        // const filename = message.from + new Date().getTime();

        // const fullFilename = mediaPath + filename + "." + extension;

        // // Save to file
        // try {
        //   fs.writeFileSync(fullFilename, media.data, { encoding: "base64" });
        //   console.log("File downloaded successfully!", fullFilename);
        //   io.emit("message", "File downloaded successfully!" + fullFilename);
        // } catch (err) {
        //   console.log("Failed to save the file:", err);
        //   io.emit("message", "Failed to save the file:" + err);
        // }
      }
    });
  } else {
    sendWebhook({ status: true, response: message });
  }
});

const checkRegisteredNumber = async function (number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
  // return true;
};

// Send message
app.post(
  "/send-message",
  [body("number").notEmpty(), body("message").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped(),
      });
    }

    const number = phoneNumberFormatter(req.body.number);
    const message = req.body.message;

    const isRegisteredNumber = await checkRegisteredNumber(number);

    if (!isRegisteredNumber) {
      return res.status(422).json({
        status: false,
        message: "The number is not registered",
      });
    }

    client
      .sendMessage(number, message)
      .then((response) => {
        data = {
          status: true,
          response: response,
        };
        sendWebhook(data);
        res.status(200).json(data);
      })
      .catch((err) => {
        res.status(500).json({
          status: false,
          response: err,
        });
      });
  }
);

// Informations of connection
app.post("/info", async (req, res) => {
  const info = await client.getState();
  res.status(200).json({
    status: true,
    response: info,
  });
});

// Check if the number is registered
app.post("/is-registered", async (req, res) => {
  const number = phoneNumberFormatter(req.body.number);
  const isRegisteredNumber = await checkRegisteredNumber(number);
  if (isRegisteredNumber) {
    res.status(200).json({
      status: true,
      response: "exists",
    });
  } else {
    res.status(200).json({
      status: false,
      response: "not exists",
    });
  }
});

// Send media
app.post("/send-media", async (req, res) => {
  const num = req.body.number;
  let number;
  if (num.includes("@g.us")) {
    number = num;
  } else {
    number = phoneNumberFormatter(num);
  }
  const caption = req.body.caption;
  const fileUrl = req.body.file;

  // const media = MessageMedia.fromFilePath("./image-example.png"); // untuk kirim based on file
  // const file = req.files.file;
  // const media = new MessageMedia(file.mimetype, file.data.toString("base64"), file.name);

  let mimetype;
  const attachment = await axios
    .get(fileUrl, {
      responseType: "arraybuffer",
    })
    .then((response) => {
      mimetype = response.headers["content-type"];
      return response.data.toString("base64");
    });

  const media = new MessageMedia(mimetype, attachment, "Media");

  client
    .sendMessage(number, media, {
      caption: caption,
    })
    .then((response) => {
      data = {
        status: true,
        response: response,
        media: media,
      };
      sendWebhook(data);
      res.status(200).json(data);
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        response: err,
      });
    });
});

const findGroupByName = async function (name) {
  const group = await client.getChats().then((chats) => {
    return chats.find(
      (chat) => chat.isGroup && chat.name.toLowerCase() == name.toLowerCase()
    );
  });
  return group;
};

// Send message to group
// You can use chatID or group name, yea!
app.post(
  "/send-group-message",
  [
    body("id").custom((value, { req }) => {
      if (!value && !req.body.name) {
        throw new Error("Invalid value, you can use `id` or `name`");
      }
      return true;
    }),
    body("message").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped(),
      });
    }

    let chatId = req.body.id;
    const groupName = req.body.name;
    const message = req.body.message;

    // Find the group by name
    if (!chatId) {
      const group = await findGroupByName(groupName);
      if (!group) {
        return res.status(422).json({
          status: false,
          message: "No group found with name: " + groupName,
        });
      }
      chatId = group.id._serialized;
    }

    client
      .sendMessage(chatId, message)
      .then((response) => {
        data = {
          status: true,
          response: response,
        };
        sendWebhook(data);
        res.status(200).json(data);
      })
      .catch((err) => {
        res.status(500).json({
          status: false,
          response: err,
        });
      });
  }
);

// Clearing message on spesific chat
app.post("/clear-message", [body("number").notEmpty()], async (req, res) => {
  const errors = validationResult(req).formatWith(({ msg }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped(),
    });
  }

  const number = phoneNumberFormatter(req.body.number);

  const isRegisteredNumber = await checkRegisteredNumber(number);

  if (!isRegisteredNumber) {
    return res.status(422).json({
      status: false,
      message: "The number is not registered",
    });
  }

  const chat = await client.getChatById(number);

  chat
    .clearMessages()
    .then((status) => {
      res.status(200).json({
        status: true,
        response: status,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        response: err,
      });
    });
});

server.listen(port, function () {
  console.log("App running on *: " + port);
});
