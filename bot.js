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
    new SlashCommandBuilder().setName('forgotcode').setDescription('Reset your password.'),
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

    // REGISTER COMMAND
    if (interaction.commandName === 'register') {
        const discordUser = interaction.user.username;
        const revoKey = `REVO-${Math.floor(100000 + Math.random() * 900000)}`;

        const { error } = await supabase.from('whitelist').insert([{ 
            username: discordUser, 
            passkey: revoKey 
        }]);
        
        if (error) {
            // Intercepts the duplicate key error shown in image_4f39a7.png
            if (error.code === '23505') {
                await interaction.reply({ content: 'You have already registered or there is an error!', ephemeral: true });
            } else {
                await interaction.reply(`Error: ${error.message}`);
            }
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

    // FORGOTCODE COMMAND
    if (interaction.commandName === 'forgotcode') {
        const discordUser = interaction.user.username;
        const newRevoKey = `REVO-${Math.floor(100000 + Math.random() * 900000)}`;

        const { error } = await supabase
            .from('whitelist')
            .update({ passkey: newRevoKey })
            .eq('username', discordUser);

        if (error) {
            await interaction.reply(`Database Error: ${error.message}`);
        } else {
            try {
                await interaction.user.send(`Your new password is: **${newRevoKey}**`);
                await interaction.reply({ content: 'I have sent your new password via DM!', ephemeral: true });
            } catch (err) {
                await interaction.reply('I could not DM you. Please check your privacy settings!');
            }
        }
    }
});

client.login(DISCORD_TOKEN);
http.createServer((req, res) => { res.write("Bot is running!"); res.end(); }).listen(process.env.PORT || 3000);
