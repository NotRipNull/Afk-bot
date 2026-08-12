const mineflayer = require('mineflayer');
const url = require('url');

// Global cache storage to hold onto live data between web pings
global.chatHistory = global.chatHistory || [];
global.botInstance = global.botInstance || null;

const config = {
  host: 'play.rajasthansmp.fun',
  port: 25565,
  username: 'NotRipHell',
  version: '1.21.11',
  loginCommand: 'login 6239735155',
  serverCommand: 'server survival'
};

// Start or reconnect the bot profile if it drops out
function startMinecraftBot() {
  if (global.botInstance && global.botInstance.entity) return;

  const bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    version: config.version,
    auth: 'offline'
  });

  global.botInstance = bot;

  bot._client.on('packet_error', () => { /* Suppress protocol warnings */ });

  bot.on('spawn', () => {
    global.chatHistory.push(`[SYSTEM] Client authenticated in lobby.`);
    bot.chat(`/${config.loginCommand}`);
    
    setTimeout(() => {
      bot.chat(`/${config.serverCommand}`);
      global.chatHistory.push(`[SYSTEM] Relayed survival migration context.`);
    }, 4000);

    // Bypasses continuous server idle timeouts
    setInterval(() => {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
    }, 40000);
  });

  bot.on('message', (jsonMsg) => {
    const message = jsonMsg.toString();
    global.chatHistory.push(message);
    if (global.chatHistory.length > 30) global.chatHistory.shift();

    if (message.includes('/register')) {
      bot.chat(`/register 6239735155 6239735155`);
    } else if (message.includes('/login') && !message.includes(config.username)) {
      bot.chat(`/${config.loginCommand}`);
    }
  });

  bot.on('end', () => {
    global.chatHistory.push(`[SYSTEM] Disconnected. Reconnecting...`);
    global.botInstance = null;
  });
}

// Vercel Serverless Web Router Entrypoint
module.exports = (req, res) => {
  // Always trigger the bot connection sequence upon a web request
  startMinecraftBot();

  const parsedUrl = url.parse(req.url, true);

  // Handle Command Submissions from the Mobile Dashboard
  if (parsedUrl.pathname === '/send' && req.method === 'GET') {
    const cmd = parsedUrl.query.cmd;
    if (cmd && global.botInstance) {
      global.botInstance.chat(cmd);
      global.chatHistory.push(`[DASHBOARD SENT] ${cmd}`);
    }
    res.writeHead(302, { 'Location': '/' });
    res.end();
    return;
  }

  // Compile layout diagnostics
  const bot = global.botInstance;
  const inventoryItems = bot && bot.inventory ? bot.inventory.items().map(item => 
    `<li>📦 <b>${item.displayName}</b> x${item.count}</li>`
  ).join('') : '<li>Syncing...</li>';

  const chatLogs = global.chatHistory.map(line => `<p style="margin:5px 0;">${line}</p>`).join('');
  const pos = bot && bot.entity ? bot.entity.position : { x: 0, y: 0, z: 0 };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Melon Controller</title>
      <style>
        body { font-family: sans-serif; background: #121212; color: #e0e0e0; padding: 15px; margin: 0; }
        .card { background: #1e1e1e; padding: 15px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        h2 { margin-top: 0; color: #4caf50; border-bottom: 1px solid #333; padding-bottom: 5px; }
        ul { padding-left: 20px; margin: 0; }
        .chat-box { height: 200px; overflow-y: scroll; background: #000; padding: 10px; border-radius: 4px; font-family: monospace; color: #a3e635; margin-bottom: 10px; }
        .input-group { display: flex; gap: 8px; }
        input[type="text"] { flex: 1; padding: 12px; background: #2a2a2a; color: #fff; border: 1px solid #444; border-radius: 4px; font-size: 16px; }
        .btn { background: #4caf50; color: white; border: none; padding: 12px 20px; border-radius: 4px; font-weight: bold; font-size: 16px; }
      </style>
    </head>
    <body>
      <h1>🍉 Remote Melon Control (Vercel)</h1>
      <div class="card">
        <h2>🎮 Remote Console Command</h2>
        <form action="/send" method="GET">
          <div class="input-group">
            <input type="text" name="cmd" placeholder="Type an in-game command..." required>
            <button class="btn" type="submit">Send</button>
          </div>
        </form>
      </div>
      <div class="card">
        <h2>📍 Bot Diagnostics</h2>
        <p><b>X:</b> ${pos.x.toFixed(1)} | <b>Y:</b> ${pos.y.toFixed(1)} | <b>Z:</b> ${pos.z.toFixed(1)}</p>
      </div>
      <div class="card">
        <h2>🎒 Live Inventory</h2>
        <ul>${inventoryItems}</ul>
      </div>
      <div class="card">
        <h2>💬 Server Terminal Stream</h2>
        <div class="chat-box">${chatLogs}</div>
      </div>
    </body>
    </html>
  `;
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
};

