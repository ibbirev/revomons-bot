const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1520835760713105518";
const GUILD_ID = "YOUR_SERVER_ID_HERE"; // <--- REPLACE WITH YOUR ID
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages 
    ] 
});

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

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
        if (interaction.commandName === 'register') {
            const { error } = await supabase.from('users').insert([{ discord_id: interaction.user.id }]);
            if (error) {
                console.error('Supabase Error:', error);
                await interaction.reply(`Database Error: ${error.message}`);
            } else {
                await interaction.reply('Successfully registered!');
            }
        }

        if (interaction.commandName === 'forgotcode') {
            const newCode = Math.floor(100000 + Math.random() * 900000).toString();
            const { error } = await supabase
                .from('users')
                .update({ access_code: newCode })
                .eq('discord_id', interaction.user.id);

            if (error) {
                console.error('Supabase Error:', error);
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
        console.error('Bot Logic Error:', err);
        await interaction.reply('An internal error occurred.');
    }
});

client.once('ready', () => { console.log(`Logged in as ${client.user.tag}!`); });
client.login(DISCORD_TOKEN);

// --- wasted space fix ---
const http = require('http');
http.createServer((req, res) => {
    res.write("Bot is running!");
    res.end();
}).listen(process.env.PORT || 3000);
