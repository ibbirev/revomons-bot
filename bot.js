const { Client, GatewayIntentBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// 1. Load your keys from the Render Environment Variables
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// 2. Initialize the services
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 3. Bot logic
client.once('ready', () => {
    console.log(`Bot is online as ${client.user.tag}!`);
});

// 4. Login the bot
client.login(DISCORD_TOKEN);
