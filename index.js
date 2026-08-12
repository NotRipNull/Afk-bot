const mineflayer = require('mineflayer');

const config = {
  host: 'play.rajasthansmp.fun',      // ⚠️ Replace with your Minecraft server IP
  port: 25565,                      
  username: 'NotRipHell',       // Change to any name you want
  version: '1.21.11',                // ⚠️ Replace with your exact server version
  
  loginCommand: 'login 6239735155',   // ⚠️ Change "password" to your actual in-game password
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
    console.log(`${bot.username} joined lobby! Authenticating...`);
    
    // Log in instantly
    bot.chat(`/${config.loginCommand}`);
    
    // Wait 5 seconds, then move to survival server
    setTimeout(() => {
      bot.chat(`/${config.serverCommand}`);
      console.log('Commands sent successfully! Bot is loading the melon farm.');
    }, 5000);

    // Anti-AFK jump loop
    setInterval(() => {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
    }, 40000);
  });

  // Backup login trigger
  bot.on('message', (jsonMsg) => {
    const message = jsonMsg.toString();
    if (message.includes('/register')) {
      bot.chat(`/register password password`); // ⚠️ Change "password" to your password
    } else if (message.includes('/login') && !message.includes(config.username)) {
      bot.chat(`/${config.loginCommand}`);
    }
  });

  bot.on('end', () => {
    console.log('Bot disconnected. Reconnecting in 15 seconds...');
    setTimeout(createBot, 15000);
  });

  bot.on('error', (err) => console.log('Error:', err));
}

createBot();
