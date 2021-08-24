const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ port: 8181 });

const stocks = {
  'AAPL': 95.0,
  'MSFT': 50.0,
  'AMZN': 300.0,
  'GOOG': 550.0,
  'YHOO': 35.0
};

const randomInterval = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

let stockUpdater;
let clientStocks = [];
const randomStockUpdater = () => {
  for (let symbol in stocks) {
    if (stocks.hasOwnProperty(symbol)) {
      const randomizedChange = randomInterval(-150, 150);
      const floatChange = randomizedChange / 100;
      stocks[symbol] += floatChange;
    }
  }
  const randomMSTime = randomInterval(500, 2500);
  stockUpdater = setTimeout(() => randomStockUpdater(), randomMSTime);
}

randomStockUpdater();

wss.on('connection', ws => {
  let clientStockUpdater;
  const sendStockUpdates = wsn => {
    if (wsn.readyState == 1) {
      const stocksObj = {};
      clientStocks.forEach(item => {
        const symbol = item;
        stocksObj[symbol] = stocks[symbol];
      });
      ws.send(JSON.stringify(stocksObj));
    }
  };

  clientStockUpdater = setInterval(() => sendStockUpdates(ws), 1000);  

  ws.on('message', message => {
    const stock_request = JSON.parse(message);
    clientStocks = stock_request['stocks'];
    sendStockUpdates(ws);
  });


  ws.on('close', () => {
    if (typeof clientStockUpdater !== 'undefined') {
      clearInterval(clientStockUpdater);
    }
  });
});
