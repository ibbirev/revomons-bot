const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const http = require('http');

// 1. Setup Constants
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1520835760713105518";
const GUILD_ID = "1517389857629147197"; 
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// 2. Initialize Clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages 
    ] 
});

// 3. Register Slash Commands
const commands = [
    new SlashCommandBuilder().setName('register').setDescription('Register your Discord account!'),
    new SlashCommandBuilder().setName('forgotcode').setDescription('Generate a new access code.'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('Successfully registered commands!');
    } catch (error) {
        console.error('Registration Error:', error);
    }
})();

// 4. Interaction Logic
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
        if (interaction.commandName === 'register') {
            // Registering to both tables at once
            const { error: userError } = await supabase.from('users').insert([{ discord_id: interaction.user.id }]);
            const { error: whitelistError } = await supabase.from('whitelist').insert([{ discord_id: interaction.user.id }]);
            
            if (userError || whitelistError) {
                console.error('DB Error:', { userError, whitelistError });
                await interaction.reply('Error: You might already be registered!');
            } else {
                await interaction.reply('Successfully registered and added to the whitelist!');
            }
        }

        if (interaction.commandName === 'forgotcode') {
            const newCode = Math.floor(100000 + Math.random() * 900000).toString();
            const { error } = await supabase.from('users').update({ access_code: newCode }).eq('discord_id', interaction.user.id);

            if (error) {
                await interaction.reply(`Database Error: ${error.message}`);
            } else {
                try {
                    await interaction.user.send(`Your new access code is: **${newCode}**`);
                    await interaction.reply({ content: 'I have sent your new code via DM!', ephemeral: true });
                } catch (err) {
                    await interaction.reply('I could not DM you. Please check your privacy settings!');
                }
            }
        }
    } catch (err) {
        console.error('Logic Error:', err);
        await interaction.reply('An internal error occurred.');
    }
});

// 5. Start the Bot
client.once('ready', () => { console.log(`Logged in as ${client.user.tag}!`); });
client.login(DISCORD_TOKEN);

// 6. Keep Render Happy (Dummy Server)
http.createServer((req, res) => { 
    res.write("Bot is running!"); 
    res.end(); 
}).listen(process.env.PORT || 3000);
