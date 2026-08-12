const mineflayer = require('mineflayer');
const http = require('http');
const url = require('url');

let chatHistory = [];
let botInstance = null;

// 1. Web Dashboard Server with Interactive Input Panel
http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // Handle Command Submission from the Dashboard Form
  if (parsedUrl.pathname === '/send' && req.method === 'GET') {
    const cmd = parsedUrl.query.cmd;
    if (cmd && botInstance) {
      botInstance.chat(cmd); // Sends the typed message/command to Minecraft
      chatHistory.push(`[DASHBOARD SENT] ${cmd}`);
      if (chatHistory.length > 30) chatHistory.shift();
    }
    // Redirect right back to main dashboard page to clear query string
    res.writeHead(302, { 'Location': '/' });
    res.end();
    return;
  }

  // Fallback default response if bot isn't initialized yet
  res.writeHead(200, { 'Content-Type': 'text/html' });
  if (!botInstance || !botInstance.entity) {
    res.end('<h1>Bot is initializing infrastructure... Refresh in a few seconds!</h1>');
    return;
  }

  // Format arrays and data vectors
  const inventoryItems = botInstance.inventory.items().map(item => 
    `<li>📦 <b>${item.displayName}</b> x${item.count}</li>`
  ).join('') || '<li>Empty</li>';

  const chatLogs = chatHistory.map(line => `<p style="margin:5px 0;">${line}</p>`).join('');
  const pos = botInstance.entity.position;

  // Build the Dashboard HTML code
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Melon Loader Panel</title>
      <style>
        body { font-family: sans-serif; background: #121212; color: #e0e0e0; padding: 15px; margin: 0; }
        .card { background: #1e1e1e; padding: 15px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        h2 { margin-top: 0; color: #4caf50; border-bottom: 1px solid #333; padding-bottom: 5px; }
        ul { padding-left: 20px; margin: 0; }
        .chat-box { height: 200px; overflow-y: scroll; background: #000; padding: 10px; border-radius: 4px; font-family: monospace; color: #a3e635; margin-bottom: 10px; }
        .input-group { display: flex; gap: 8px; margin-top: 10px; }
        input[type="text"] { flex: 1; padding: 12px; background: #2a2a2a; color: #fff; border: 1px solid #444; border-radius: 4px; font-size: 16px; }
        .btn { background: #4caf50; color: white; border: none; padding: 12px 20px; border-radius: 4px; font-weight: bold; font-size: 16px; cursor: pointer; }
        .btn-refresh { background: #2196f3; width: 100%; margin-top: 5px; }
      </style>
    </head>
    <body>
      <h1>🍉 Remote Melon Control</h1>
      
      <!-- Interactive Remote Controller Panel -->
      <div class="card">
        <h2>🎮 Remote Console Command</h2>
        <form action="/send" method="GET">
          <div class="input-group">
            <input type="text" name="cmd" placeholder="Type a message or command (e.g. /home or Hello!)..." required autocomplete="off">
            <button class="btn" type="submit">Send</button>
          </div>
        </form>
      </div>

      <div class="card">
        <h2>📍 Bot Diagnostics</h2>
        <p><b>X:</b> ${pos.x.toFixed(1)} | <b>Y:</b> ${pos.y.toFixed(1)} | <b>Z:</b> ${pos.z.toFixed(1)}</p>
        <p><b>Health Status:</b> ❤️ ${Math.round(botInstance.health)}/20 | <b>Hunger:</b> 🍖 ${Math.round(botInstance.food)}/20</p>
      </div>

      <div class="card">
        <h2>🎒 Live Inventory slots</h2>
        <ul>${inventoryItems}</ul>
      </div>

      <div class="card">
        <h2>💬 Server Terminal Stream</h2>
        <div class="chat-box">${chatLogs}</div>
        <button class="btn btn-refresh" onclick="location.reload()">🔄 Refresh Logs & Data</button>
      </div>
    </body>
    </html>
  `;
  res.end(html);
}).listen(process.env.PORT || 3000, () => {
  console.log('Interactive console proxy operational.');
});

// 2. Core Minecraft Agent Environment
const config = {
  host: 'play.rajasthansmp.fun',
  port: 25565,
  username: 'NotRipHell',
  version: '1.21.11',
  loginCommand: 'login 6239735155',
  serverCommand: 'server survival'
};

function createBot() {
  const bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    version: config.version,
    auth: 'offline'
  });

  botInstance = bot; 

  bot.on('spawn', () => {
    console.log(`${bot.username} loaded environment! Initializing automation routing...`);
    chatHistory.push(`[SYSTEM] Client authenticated in hub.`);
    
    bot.chat(`/${config.loginCommand}`);
    
    setTimeout(() => {
      bot.chat(`/${config.serverCommand}`);
      chatHistory.push(`[SYSTEM] Relayed survival migration context.`);
    }, 5000);

    // Anti-AFK engine ticks
    setInterval(() => {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
    }, 40000);
  });

  bot.on('message', (jsonMsg) => {
    const message = jsonMsg.toString();
    
    chatHistory.push(message);
    if (chatHistory.length > 30) chatHistory.shift();

    if (message.includes('/register')) {
      bot.chat(`/register 6239735155 6239735155`);
    } else if (message.includes('/login') && !message.includes(config.username)) {
      bot.chat(`/${config.loginCommand}`);
    }
  });

  bot.on('end', () => {
    chatHistory.push(`[SYSTEM] Core disconnected. Executing fallback reconnect...`);
    setTimeout(createBot, 15000);
  });

  bot.on('error', (err) => {
    chatHistory.push(`[ERROR] ${err.message}`);
  });
}

createBot();
