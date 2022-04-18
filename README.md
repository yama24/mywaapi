# mywaapi
WhatsApp API made by me

![Logo](https://static.whatsapp.net/rsrc.php/v3/yO/r/FsWUqRoOsPu.png)

## Thanks for :
 - [axios](https://github.com/axios/axios)
 - [express](https://github.com/expressjs/express)
 - [How to write a Good readme](https://bulldogjob.com/news/449-how-to-write-a-good-readme-for-your-github-project)
 - [express-fileupload](https://github.com/richardgirges/express-fileupload)
 - [express-validator](https://github.com/express-validator/express-validator)
 - [nodemon](https://github.com/remy/nodemon)
 - [qrcode](https://github.com/soldair/node-qrcode)
 - [qrcode-terminal](https://github.com/gtanner/qrcode-terminal)
 - [socket.io](https://github.com/socketio/socket.io)
 - [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js/)


## 🚀 About Me
I'm a full stack developer...


## Installation

Install waapi project with npm after cloning

```bash
  npm install
  cd mywaapi
  npm run start:dev
```

then open http://localhost:8000/ for scaning qrCode or scaning qrCode from terminal


## API Reference

#### Send Message

```http
  POST /send-message
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `number` | `string` | **Required**. destination number |
| `message` | `string` | **Required**. message you want to send |

#### Send Media

```http
  POST /send-media
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `number` | `string` | **Required**. destination number |
| `caption` | `string` | **Required**. required captions |
| `file` | `string` | **Required**. url or base64 file format |

#### Send Message To Group

```http
  POST /send-group-message
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `string` | **Required**. destination number (6289861821283-1627374981@g.us) |
| `message` | `string` | **Required**. message you want to send |

The group id can be obtained by sending a !groups message to the bot. then the bot will send all group data in which there are bots and you.