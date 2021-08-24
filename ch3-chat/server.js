const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const wss = new WebSocketServer({ port: 8181 });
const uuid = require('node-uuid');

const clients = [];

let clientIndex = 1;

const wsSend = (type, clientId, nickname, message) => {
  clients.forEach(client => {
    const clientSocket = client.ws;
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(JSON.stringify({
        type,
        id: clientId,
        nickname,
        message: message.toString()
      }));
    }
  });
};

wss.on('connection', ws => {
  const clientId = uuid.v4();
  const nickname = `AnonymousUser ${clientIndex}`;
  clientIndex++;

  clients.push({ id: clientId, nickname, ws });
  console.log(`Client ${clientId} connected`);

  const connectMessage = `${nickname} has connected`;
  wsSend('notification', clientId, nickname, connectMessage);

  ws.on('message', message => {
    if (message.indexOf('/nick') === 0) {
      const nicknameArray = message.split(' ');
      if (nicknameArray.length >= 2) {
        const oldNickname = nickname;
        nickname = nicknameArray[1];
        const nicknameMessage = `Client ${oldNickname} changed to ${nickname}`;
        wsSend('nick_update', clientId, nickname, message);
      }
    } else {
      wsSend('message', clientId, nickname, message);
    }
  });

  const closeSocket = customMessage => {
    let disconnectMessage = '';
    clients.filter(client => {
      if (client.id === clientId) {
        if (customMessage) {
          disconnectMessage = customMessage;
        } else {
          disconnectMessage = `${nickname} has disconnected`;
        }
        wsSend('notification', clientId, nickname, disconnectMessage);
      }
      return client.id !== clientId;
    });
  }

  ws.on('close', () => closeSocket());

  process.on('SIGINT', () => {
    console.log('Closing things');
    closeSocket('Server has disconnected');
    process.exit();
  })
});

