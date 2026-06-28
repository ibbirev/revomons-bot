const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1520835760713105518"; // Your Client ID
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// 1. Define the Command
const commands = [
    new SlashCommandBuilder().setName('register').setDescription('Register your Discord account!'),
].map(command => command.toJSON());

// 2. Register the Command with Discord
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('Successfully registered /register command!');
    } catch (error) {
        console.error(error);
    }
})();

// 3. Handle the Logic
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'register') {
        const userId = interaction.user.id;
        
        // Add to Supabase
        const { error } = await supabase.from('users').insert([{ discord_id: userId }]);

        if (error) {
            await interaction.reply('You are already registered or there was an error!');
        } else {
            await interaction.reply('Successfully registered!');
        }
    }
});

client.once('ready', () => { console.log(`Logged in as ${client.user.tag}!`); });
client.login(DISCORD_TOKEN);
