const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const http = require('http');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1520835760713105518";
const GUILD_ID = "1517389857629147197"; 
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages] 
});

const commands = [
    new SlashCommandBuilder().setName('register').setDescription('Register your account.'),
    new SlashCommandBuilder().setName('forgotcode').setDescription('Reset your code.'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('Commands registered!');
    } catch (error) { console.error(error); }
})();

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'register') {
        const revoId = `REVO-${Math.floor(100000 + Math.random() * 900000)}`;
        const accessCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Saving to 'whitelist' table
        const { error } = await supabase.from('whitelist').insert([{ 
            username: revoId, 
            passkey: accessCode 
        }]);
        
        if (error) {
            await interaction.reply(`Error: ${error.message}`);
        } else {
            try {
                // DM the user their credentials
                await interaction.user.send(`**Registration Successful!**\n\nYour Login Details:\nUsername: \`${revoId}\`\nAccess Code: \`${accessCode}\``);
                await interaction.reply({ content: 'I have sent your login details to your DMs!', ephemeral: true });
            } catch (err) {
                await interaction.reply('I successfully registered you, but I could not send your DM! Please check your privacy settings.');
            }
        }
    }
});

client.login(DISCORD_TOKEN);
http.createServer((req, res) => { res.write("Bot is running!"); res.end(); }).listen(process.env.PORT || 3000);
