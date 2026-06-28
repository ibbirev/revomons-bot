// ... (Keep your existing imports, client setup, and command registration code)

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
        if (interaction.commandName === 'register') {
            // 1. Add to 'users' table
            const { error: userError } = await supabase
                .from('users')
                .insert([{ discord_id: interaction.user.id }]);

            // 2. Add to 'whitelist' table
            const { error: whitelistError } = await supabase
                .from('whitelist')
                .insert([{ discord_id: interaction.user.id }]);
            
            if (userError || whitelistError) {
                console.error('Registration/Whitelist Error:', userError || whitelistError);
                await interaction.reply('Error: You might already be registered/whitelisted, or the database is blocked.');
            } else {
                await interaction.reply('Successfully registered and added to the whitelist!');
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

// ... (Keep your client.login line)
