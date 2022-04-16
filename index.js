// const qrcode = require("qrcode-terminal");
const qrcode = require("qrcode");
const express = require("express");
const http = require("http");
const fileUpload = require("express-fileupload");
const axios = require("axios");
const socketIO = require("socket.io");
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
    debug: true,
  })
);

app.use("/html/assets", express.static(__dirname + "/html/assets"));

app.get("/", (req, res) => {
  res.sendFile("index.html", {
    root: __dirname,
  });
});

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
  });

  client.on("qr", (qr) => {
    console.log("QR RECEIVED", qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit("qr", url);
      socket.emit("message", "QR Code received, scan please!");
    });
  });

  client.on("ready", () => {
    socket.emit("ready", "Whatsapp is ready!");
    socket.emit("message", "Whatsapp is ready!");
  });

  client.on("authenticated", () => {
    socket.emit("authenticated", "Whatsapp is authenticated!");
    socket.emit("message", "Whatsapp is authenticated!");
    console.log("AUTHENTICATED");
  });

  client.on("auth_failure", function (session) {
    socket.emit("message", "Auth failure, restarting...");
  });

  client.on("disconnected", (reason) => {
    socket.emit("message", "Whatsapp is disconnected!");
    client.destroy();
    client.initialize();
  });
});

// client.on("qr", (qr) => {
//   // console.log('QR RECEIVED', qr);
//   qrcode.generate(qr, { small: true });
// });

// client.on("authenticated", () => {
//   console.log("Authenticated");
// });

// client.on("ready", () => {
//   console.log("Client is ready!");
// });

client.on("message", async (message) => {
  if (message.body === "!ping") {
    message.reply("pong"); // mode reply
  } else if (message.body.startsWith("!sendto ")) {
    // Direct send a new message to specific id
    var number = message.body.split(" ")[1];
    var messageIndex = message.body.indexOf(number) + number.length;
    var messageBody = message.body.slice(messageIndex, message.body.length);
    number = number.includes("@c.us") ? number : `${number}@c.us`;
    client.sendMessage(number, messageBody);
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
      "Siapa nama Presiden Republik Indonesia",
      "Opsi",
      sections,
      "Pertanyaan 1",
      "footer"
    );
    client.sendMessage(message.from, list);
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
});

const checkRegisteredNumber = async function (number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
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
        res.status(200).json({
          status: true,
          response: response,
        });
      })
      .catch((err) => {
        res.status(500).json({
          status: false,
          response: err,
        });
      });
  }
);

// Send media
app.post("/send-media", async (req, res) => {
  const number = phoneNumberFormatter(req.body.number);
  const caption = req.body.caption;
  const fileUrl = req.body.file;

  // const media = MessageMedia.fromFilePath('./image-example.png');
  // const file = req.files.file;
  // const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);
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
      res.status(200).json({
        status: true,
        response: response,
      });
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
        res.status(200).json({
          status: true,
          response: response,
        });
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
