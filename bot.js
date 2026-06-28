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
        const discordUser = interaction.user.username;
        const revoKey = `REVO-${Math.floor(100000 + Math.random() * 900000)}`;

        const { error } = await supabase.from('whitelist').insert([{ 
            username: discordUser, 
            passkey: revoKey 
        }]);
        
        if (error) {
            await interaction.reply(`Error: ${error.message}`);
        } else {
            try {
                await interaction.user.send(
                    `**Registration Successful!**\n\n` +
                    `You can now log into the site using these credentials:\n\n` +
                    `Username: \`${discordUser}\`\n` +
                    `Password: \`${revoKey}\``
                );
                await interaction.reply({ content: 'I have sent your login credentials to your DMs!', ephemeral: true });
            } catch (err) {
                await interaction.reply('I registered you, but I could not send the DM. Please check your privacy settings!');
            }
        }
    }

    if (interaction.commandName === 'forgotcode') {
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        const { error } = await supabase.from('users').update({ access_code: newCode }).eq('discord_id', interaction.user.id);

        if (error) await interaction.reply(`Error: ${error.message}`);
        else {
            try {
                await interaction.user.send(`Your new access code is: **${newCode}**`);
                await interaction.reply({ content: 'I have sent your new code via DM!', ephemeral: true });
            } catch (err) { await interaction.reply('I could not DM you. Please check your privacy settings!'); }
        }
    }
});

client.login(DISCORD_TOKEN);
http.createServer((req, res) => { res.write("Bot is running!"); res.end(); }).listen(process.env.PORT || 3000);
