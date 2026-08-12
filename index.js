const mineflayer = require('mineflayer');
const http = require('http');

// 1. Storage for live tracking data
let chatHistory = [];
let botInstance = null;

// 2. Interactive Web Dashboard for your Phone Browser
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  
  if (!botInstance || !botInstance.entity) {
    res.end('<h1>Bot is starting up... Refresh in a moment!</h1>');
    return;
  }

  // Format inventory items into a readable list
  const inventoryItems = botInstance.inventory.items().map(item => 
    `<li>📦 <b>${item.displayName}</b> x${item.count}</li>`
  ).join('') || '<li>Empty</li>';

  // Format chat logs into scrollable HTML
  const chatLogs = chatHistory.map(line => `<p style="margin:5px 0;">${line}</p>`).join('');

  // Grab bot position
  const pos = botInstance.entity.position;

  // Simple HTML Dashboard Layout
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Melon Bot Dashboard</title>
      <style>
        body { font-family: sans-serif; background: #121212; color: #e0e0e0; padding: 15px; margin: 0; }
        .card { background: #1e1e1e; padding: 15px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        h2 { margin-top: 0; color: #4caf50; border-bottom: 1px solid #333; padding-bottom: 5px; }
        ul { padding-left: 20px; margin: 0; }
        .chat-box { height: 200px; overflow-y: scroll; background: #000; padding: 10px; border-radius: 4px; font-family: monospace; color: #a3e635; }
        .btn { background: #4caf50; color: white; border: none; padding: 10px; width: 100%; border-radius: 4px; font-weight: bold; margin-top: 10px; }
      </style>
    </head>
    <body>
      <h1>🍉 Melon Loader Status</h1>
      
      <div class="card">
        <h2>📍 Bot Position POV</h2>
        <p><b>X:</b> ${pos.x.toFixed(1)} | <b>Y:</b> ${pos.y.toFixed(1)} | <b>Z:</b> ${pos.z.toFixed(1)}</p>
        <p><b>Current Health:</b> ❤️ ${Math.round(botInstance.health)}/20</p>
        <p><b>Food Level:</b> 🍖 ${Math.round(botInstance.food)}/20</p>
      </div>

      <div class="card">
        <h2>🎒 Live Inventory</h2>
        <ul>${inventoryItems}</ul>
      </div>

      <div class="card">
        <h2>💬 Live Server Chat Logs</h2>
        <div class="chat-box">${chatLogs}</div>
        <button class="btn" onclick="location.reload()">🔄 Refresh Live Data</button>
      </div>
    </body>
    </html>
  `;
  res.end(html);
}).listen(process.env.PORT || 3000, () => {
  console.log('Web dashboard interface initialized.');
});

// 3. Main Minecraft Bot Script
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

  botInstance = bot; // Link to web server snapshot

  bot.on('spawn', () => {
    console.log(`${bot.username} entered the lobby!`);
    chatHistory.push(`[SYSTEM] Bot spawned in lobby.`);
    
    bot.chat(`/${config.loginCommand}`);
    
    setTimeout(() => {
      bot.chat(`/${config.serverCommand}`);
      chatHistory.push(`[SYSTEM] Sent world change commands.`);
    }, 5000);

    setInterval(() => {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
    }, 40000);
  });

  // Intercept game chat messages to display on your web portal
  bot.on('message', (jsonMsg) => {
    const message = jsonMsg.toString();
    
    // Save to dashboard logs (keep last 30 lines)
    chatHistory.push(message);
    if (chatHistory.length > 30) chatHistory.shift();

    // Secondary login backup check
    if (message.includes('/register')) {
      bot.chat(`/register 6239735155 6239735155`);
    } else if (message.includes('/login') && !message.includes(config.username)) {
      bot.chat(`/${config.loginCommand}`);
    }
  });

  bot.on('end', () => {
    chatHistory.push(`[SYSTEM] Disconnected from server. Reconnecting...`);
    setTimeout(createBot, 15000);
  });

  bot.on('error', (err) => {
    chatHistory.push(`[ERROR] ${err.message}`);
  });
}

createBot();

