# mywaapi
WhatsApp API made by me

![Logo](https://static.whatsapp.net/rsrc.php/v3/yO/r/FsWUqRoOsPu.png)

## Thanks for :
 - [axios](https://github.com/axios/axios)
 - [express](https://github.com/expressjs/express)
 - [express-fileupload](https://github.com/richardgirges/express-fileupload)
 - [express-validator](https://github.com/express-validator/express-validator)
 - [nodemon](https://github.com/remy/nodemon)
 - [qrcode](https://github.com/soldair/node-qrcode)
 - [qrcode-terminal](https://github.com/gtanner/qrcode-terminal)
 - [socket.io](https://github.com/socketio/socket.io)
 - [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js/)


## Installation

Before installation, make sure NodeJs version 12 or higher and npm is installed

Clone the project

```bash
  git clone https://github.com/yama24/mywaapi.git
```

Go to the project directory

```bash
  cd mywaapi
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start
```

and for the Dev mode

```bash
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

## Hidden Feature

Do this by sending a message to the bot

| Message             | Response                                                                |
| ----------------- | ------------------------------------------------------------------ |
| **!ping** | pong |
| **!sendto 6289861821283 this is the message** | bot will send message 'this is the message' to '6289861821283' |
| **!info** | an information about bot |
| **!buttons** | an example buttons of WhatsApp (under maintenance) |
| **!lists** | an example list of WhatsApp |
| **!game** | a simple multiple choice game (change question and answer in [game.js](https://github.com/yama24/mywaapi/blob/view/game.js)) |
| **!groups** | a list of groups that you and the bot follow |


## 🚀 About Me
I'm a full stack developer...

[![portfolio](https://img.shields.io/badge/my_portfolio-000?style=for-the-badge&logo=ko-fi&logoColor=white)](https://humanoo.id/yama)
[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/yayan-maulana-836883212/)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/P5P2C831E)