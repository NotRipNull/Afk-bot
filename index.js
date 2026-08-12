const mineflayer = require('mineflayer');
const http = require('http');

// 1. Web server component to fulfill Render's hosting checklist
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Minecraft AFK Bot is alive and running 24/7!');
}).listen(process.env.PORT || 3000, () => {
  console.log('Web server is active to prevent hosting sleep cycles.');
});

// 2. Main bot parameters
const config = {
  host: 'play.rajasthansmp.fun',
  port: 25565,
  username: 'NotRipHell',
  version: '1.21.11', // Updated to match your server's exact protocol version

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

  bot.on('spawn', () => {
    console.log(`${bot.username} entered the lobby! Running authentication...`);
    
    // Step 1: Push authentication directly upon interface loading
    bot.chat(`/${config.loginCommand}`);
    
    // Step 2: Clear a 5-second buffer for processing before jumping worlds
    setTimeout(() => {
      bot.chat(`/${config.serverCommand}`);
      console.log('Routing commands broadcasted! Loading melon chunks...');
    }, 5000);

    // Anti-AFK engine loop to bypass continuous idle timers
    setInterval(() => {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
    }, 40000);
  });

  // Secondary backup trigger if custom plugins block direct spawn messages
  bot.on('message', (jsonMsg) => {
    const message = jsonMsg.toString();
    if (message.includes('/register')) {
      bot.chat(`/register 6239735155 6239735155`);
    } else if (message.includes('/login') && !message.includes(config.username)) {
      bot.chat(`/${config.loginCommand}`);
    }
  });

  bot.on('end', () => {
    console.log('Bot disconnected from the server. Reconnecting in 15 seconds...');
    setTimeout(createBot, 15000);
  });

  bot.on('error', (err) => console.log('Runtime network error detected:', err));
}

createBot();
