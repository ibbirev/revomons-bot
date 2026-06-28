const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1520835760713105518";
const GUILD_ID = "1517389857629147197";
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
    new SlashCommandBuilder().setName('forgotcode').setDescription('Generate a new access code and get it via DM.'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
    try {
        // This forces the commands to appear in your specific server instantly
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('Successfully registered commands to your server!');
    } catch (error) {
        console.error(error);
    }
})();

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'register') {
        const { error } = await supabase.from('users').insert([{ discord_id: interaction.user.id }]);
        await interaction.reply(error ? 'You are already registered or there was an error!' : 'Successfully registered!');
    }

    if (interaction.commandName === 'forgotcode') {
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();

        const { error } = await supabase
            .from('users')
            .update({ access_code: newCode })
            .eq('discord_id', interaction.user.id);

        if (error) {
            return interaction.reply('Error updating your code. Make sure you are registered first!');
        }

        try {
            await interaction.user.send(`Your new access code is: **${newCode}**`);
            await interaction.reply({ content: 'I have sent your new code via DM!', ephemeral: true });
        } catch (err) {
            await interaction.reply('I could not DM you. Please check your privacy settings!');
        }
    }
});

client.once('ready', () => { console.log(`Logged in as ${client.user.tag}!`); });
client.login(DISCORD_TOKEN);
