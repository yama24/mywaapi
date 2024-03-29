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
  res.sendFile("/html/index-multi.html", {
    root: __dirname,
  });
});

const sessions = [];
const SESSIONS_FILE = "./whatsapp-sessions.json";

const createSessionsFileIfNotExists = function () {
  if (!fs.existsSync(SESSIONS_FILE)) {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
      console.log("Sessions file created successfully.");
    } catch (err) {
      console.log("Failed to create sessions file: ", err);
    }
  }
};

createSessionsFileIfNotExists();

const setSessionsFile = function (sessions) {
  fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions), function (err) {
    if (err) {
      console.log(err);
    }
  });
};

const getSessionsFile = function () {
  return JSON.parse(fs.readFileSync(SESSIONS_FILE));
};

const createSession = function (id, description) {
  console.log("Creating session: " + id);

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
    authStrategy: new LocalAuth({
      clientId: id,
    }),
  });

  client.initialize();

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
          // The folder to store: change as you want!
          // Create if not exists
          const mediaPath = "./downloaded-media/";

          if (!fs.existsSync(mediaPath)) {
            fs.mkdirSync(mediaPath);
          }

          // Get the file extension by mime-type
          const extension = mime.extension(media.mimetype);

          // Filename: change as you want!
          // I will use the time for this example
          // Why not use media.filename? Because the value is not certain exists
          const filename = message.from + new Date().getTime();

          const fullFilename = mediaPath + filename + "." + extension;

          // Save to file
          try {
            fs.writeFileSync(fullFilename, media.data, { encoding: "base64" });
            console.log("File downloaded successfully!", fullFilename);
            io.emit("message", "File downloaded successfully!" + fullFilename);
          } catch (err) {
            console.log("Failed to save the file:", err);
            io.emit("message", "Failed to save the file:" + err);
          }
        }
      });
    }
  });

//   io.emit("message", { id: id, text: "Connecting..." });

  client.on("change_state", (state) => {
    io.emit("message", { id: id, text: `State changed to ${state}` });
    console.log("State changed to", state);
  });

  client.on("qr", (qr) => {
    console.log(`${id} QR RECEIVED`, qr);
    // qrterminal.generate(qr, { small: true });
    qrcode.toDataURL(qr, (err, url) => {
      io.emit("qr", { id: id, src: url });
      io.emit("message", {
        id: id,
        text: "QR Code received, scan please!",
      });
    });
  });

  client.on("ready", () => {
    io.emit("ready", { id: id });
    io.emit("message", { id: id, text: "Whatsapp is ready!" });
    console.log(`${id} READY`);

    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);
    savedSessions[sessionIndex].ready = true;
    setSessionsFile(savedSessions);
  });

  client.on("authenticated", () => {
    io.emit("authenticated", { id: id });
    io.emit("message", { id: id, text: "Whatsapp is authenticated!" });
    console.log(`${id} AUTHENTICATED`);
  });

  client.on("auth_failure", function (session) {
    io.emit("message", { id: id, text: "Auth failure, restarting..." });
    console.log(`${id} AUTH FAILURE`);
  });

  client.on("disconnected", (reason) => {
    io.emit("message", { id: id, text: "Whatsapp is disconnected!" });
    console.log(`${id} DISCONNECTED`);
    client.destroy();
    client.initialize();

    // Menghapus pada file sessions
    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);
    savedSessions.splice(sessionIndex, 1);
    setSessionsFile(savedSessions);

    io.emit("remove-session", id);
  });

  // Tambahkan client ke sessions
  sessions.push({
    id: id,
    description: description,
    client: client,
  });

  // Menambahkan session ke file
  const savedSessions = getSessionsFile();
  const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);

  if (sessionIndex == -1) {
    savedSessions.push({
      id: id,
      description: description,
      ready: false,
    });
    setSessionsFile(savedSessions);
  }
};

const init = function (socket) {
  const savedSessions = getSessionsFile();
  
  if (savedSessions.length > 0) {
    if (socket) {
      /**
       * At the first time of running (e.g. restarting the server), our client is not ready yet!
       * It will need several time to authenticating.
       *
       * So to make people not confused for the 'ready' status
       * We need to make it as FALSE for this condition
       */
      savedSessions.forEach((e, i, arr) => {
        arr[i].ready = false;
        // createSession(e.id, e.description);
      });

      socket.emit("init", savedSessions);
    } else {
      savedSessions.forEach((sess) => {
        createSession(sess.id, sess.description);
      });
    }
  }
};

init();

io.on("connection", function (socket) {
  init(socket);
  socket.on("create-session", function (data) {
    console.log("Create session: " + data.id);
    createSession(data.id, data.description);
  });
});

const checkRegisteredNumber = async function (number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
};

// // Send message
// app.post(
//   "/send-message",
//   [body("number").notEmpty(), body("message").notEmpty()],
//   async (req, res) => {
//     const errors = validationResult(req).formatWith(({ msg }) => {
//       return msg;
//     });

//     if (!errors.isEmpty()) {
//       return res.status(422).json({
//         status: false,
//         message: errors.mapped(),
//       });
//     }

//     const number = phoneNumberFormatter(req.body.number);
//     const message = req.body.message;

//     const isRegisteredNumber = await checkRegisteredNumber(number);

//     if (!isRegisteredNumber) {
//       return res.status(422).json({
//         status: false,
//         message: "The number is not registered",
//       });
//     }

//     client
//       .sendMessage(number, message)
//       .then((response) => {
//         res.status(200).json({
//           status: true,
//           response: response,
//         });
//       })
//       .catch((err) => {
//         res.status(500).json({
//           status: false,
//           response: err,
//         });
//       });
//   }
// );

// // Send media
// app.post("/send-media", async (req, res) => {
//   const number = phoneNumberFormatter(req.body.number);
//   const caption = req.body.caption;
//   const fileUrl = req.body.file;

//   // const media = MessageMedia.fromFilePath("./image-example.png"); // untuk kirim based on file
//   // const file = req.files.file;
//   // const media = new MessageMedia(file.mimetype, file.data.toString("base64"), file.name);

//   let mimetype;
//   const attachment = await axios
//     .get(fileUrl, {
//       responseType: "arraybuffer",
//     })
//     .then((response) => {
//       mimetype = response.headers["content-type"];
//       return response.data.toString("base64");
//     });

//   const media = new MessageMedia(mimetype, attachment, "Media");

//   client
//     .sendMessage(number, media, {
//       caption: caption,
//     })
//     .then((response) => {
//       res.status(200).json({
//         status: true,
//         response: response,
//       });
//     })
//     .catch((err) => {
//       res.status(500).json({
//         status: false,
//         response: err,
//       });
//     });
// });

// const findGroupByName = async function (name) {
//   const group = await client.getChats().then((chats) => {
//     return chats.find(
//       (chat) => chat.isGroup && chat.name.toLowerCase() == name.toLowerCase()
//     );
//   });
//   return group;
// };

// // Send message to group
// // You can use chatID or group name, yea!
// app.post(
//   "/send-group-message",
//   [
//     body("id").custom((value, { req }) => {
//       if (!value && !req.body.name) {
//         throw new Error("Invalid value, you can use `id` or `name`");
//       }
//       return true;
//     }),
//     body("message").notEmpty(),
//   ],
//   async (req, res) => {
//     const errors = validationResult(req).formatWith(({ msg }) => {
//       return msg;
//     });

//     if (!errors.isEmpty()) {
//       return res.status(422).json({
//         status: false,
//         message: errors.mapped(),
//       });
//     }

//     let chatId = req.body.id;
//     const groupName = req.body.name;
//     const message = req.body.message;

//     // Find the group by name
//     if (!chatId) {
//       const group = await findGroupByName(groupName);
//       if (!group) {
//         return res.status(422).json({
//           status: false,
//           message: "No group found with name: " + groupName,
//         });
//       }
//       chatId = group.id._serialized;
//     }

//     client
//       .sendMessage(chatId, message)
//       .then((response) => {
//         res.status(200).json({
//           status: true,
//           response: response,
//         });
//       })
//       .catch((err) => {
//         res.status(500).json({
//           status: false,
//           response: err,
//         });
//       });
//   }
// );

// // Clearing message on spesific chat
// app.post("/clear-message", [body("number").notEmpty()], async (req, res) => {
//   const errors = validationResult(req).formatWith(({ msg }) => {
//     return msg;
//   });

//   if (!errors.isEmpty()) {
//     return res.status(422).json({
//       status: false,
//       message: errors.mapped(),
//     });
//   }

//   const number = phoneNumberFormatter(req.body.number);

//   const isRegisteredNumber = await checkRegisteredNumber(number);

//   if (!isRegisteredNumber) {
//     return res.status(422).json({
//       status: false,
//       message: "The number is not registered",
//     });
//   }

//   const chat = await client.getChatById(number);

//   chat
//     .clearMessages()
//     .then((status) => {
//       res.status(200).json({
//         status: true,
//         response: status,
//       });
//     })
//     .catch((err) => {
//       res.status(500).json({
//         status: false,
//         response: err,
//       });
//     });
// });

server.listen(port, function () {
  console.log("App running on *: " + port);
});
