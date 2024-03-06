import './style.css'
import Chart from 'chart.js/auto';
import 'chartjs-adapter-moment';
import 'moment';
import moment from 'moment';


let socket = new WebSocket("wss://ws.bitstamp.net/");


const app = document.getElementById('app')

const chartCanvas: HTMLCanvasElement = app?.querySelector("#btc-chart")!;

const chart = new Chart(chartCanvas, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'BTC/USD',
      data: [],
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
      fill: false
    }]
  },
  options: {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'second',
        }
      }
    }
  }
});

const connectButton: HTMLButtonElement | null | undefined = app?.querySelector("#connect");
const statusDiv = app?.querySelector("#status");
let connected = false;

if (connectButton) {
  connectButton.addEventListener("click", () => {
    if (!connected) {
      subscribeToTrades();
      connected = true;
      connectButton.innerHTML = "Disconnect";
      if (statusDiv) {
        const statusText = statusDiv.querySelector("span");
        if (statusText)
          statusText.textContent = "Connected";
        statusDiv?.classList.add("connected");
      }
    } else {
      unsubscribeToTrades();
      connected = false;
      connectButton.innerHTML = "Connect";
      if (statusDiv) {
        const statusText = statusDiv.querySelector("span");
        if (statusText)
          statusText.textContent = "Disconnected";
        statusDiv?.classList.remove("connected");
      }
    }

  })
}

socket.onopen = function () {
  if (connectButton) {
    connectButton.disabled = false;
  }
};

function subscribeToTrades() {
  socket.send(JSON.stringify({
    "event": "bts:subscribe",
    "data": {
      "channel": "live_trades_btcusd"
    }
  }));
}

function unsubscribeToTrades() {
  socket.send(JSON.stringify({
    "event": "bts:unsubscribe",
    "data": {
      "channel": "live_trades_btcusd"
    }
  }));
}

socket.onmessage = function (event) {
  // alert(`[message] Data received from server: ${event.data}`);
  let data = JSON.parse(event.data);
  if (data.event === "trade") {
    // plotly.js code
    let trade = data.data;
    const timestamp = moment(trade.microtimestamp / 1000);
    console.log(trade.microtimestamp/1000);
    
    
    
    
    
    (chart?.data?.labels as any[]).push(timestamp);
    (chart.data.datasets[0].data as any[]).push(trade.price);
    chart.update();


    const messageDiv = app?.querySelector("#message");
    if (messageDiv) {
      messageDiv.innerHTML = `Trade: ${trade.amount} BTC at $${trade.price}`;
    }
  }
};

socket.onclose = function (event: CloseEvent) {
  if (event.wasClean) {
    alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
  } else {
    // e.g. server process killed or network down
    // event.code is usually 1006 in this case
    alert('[close] Connection died');
  }
};

socket.onerror = function (error: Event) {
  alert(`[error] ${error}`);
};
