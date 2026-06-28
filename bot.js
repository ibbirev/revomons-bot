const { Client, GatewayIntentBits, SlashCommandBuilder, Routes } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// ⚙️ CONFIGURATION KEYS
process.env.DISCORD_TOKEN
const CLIENT_ID = "1520835760713105518"; 
process.env.SUPABASE_URL
process.env.SUPABASE_KEY 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Register the slash command structure
const commands = [
    new SlashCommandBuilder()
        .setName('register')
        .setDescription('Generate your private access passkey token for the Trading Board')
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`🤖 Bot logged in as ${client.user.tag}`);
    try {
        // Publish slash commands to Discord globally
        await client.rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('✅ Registered /register slash command successfully.');
    } catch (error) {
        console.error('Registration Error:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'register') {
        const username = interaction.user.username.toLowerCase();
        
        // Generate a random numeric token passkey string
        const generatedCode = "REVO-" + Math.floor(100000 + Math.random() * 900000);

        // Sync token row directly to your live Supabase database
        const { error } = await supabase
            .from('whitelist')
            .upsert({ username: username, passkey: generatedCode }, { onConflict: 'username' });

        if (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Database synchronization error.', ephemeral: true });
            return;
        }

        // Return token directly inside an ephemeral message (hidden from chat history)
        await interaction.reply({ 
            content: `👋 **Access Granted, @${username}!**\nYour credential key has been mapped to the portal:\n\n**Username:** \`${username}\`\n**Passkey Code:** \`${generatedCode}\`\n\nPaste this code into the website login window to connect!`, 
            ephemeral: true 
        });
    }
});

client.login(DISCORD_TOKEN);
