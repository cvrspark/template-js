const { Events, MessageFlags, Collection } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {

        // Handle buttons
        if (interaction.isButton()) {
            const button = interaction.client.buttons.get(interaction.customId);
            if (!button) return;
            try {
                await button.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error while executing this button!', ephemeral: true });
            }
            return;
        }

        if (interaction.isAnySelectMenu && interaction.isAnySelectMenu()) {
            const selectMenu = interaction.client.selectMenus.get(interaction.customId);
            if (!selectMenu) return;
            try {
                await selectMenu.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error while executing this select menu!', ephemeral: true });
            }
            return;
        }

        if (interaction.isModalSubmit && interaction.isModalSubmit()) {
            const modal = interaction.client.modals.get(interaction.customId);
            if (!modal) return;
            try {
                await modal.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error while executing this modal!', ephemeral: true });
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        const { cooldowns } = interaction.client;
        if (!cooldowns.has(command.data.name)) {
            cooldowns.set(command.data.name, new Collection());
        }
        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name);
        const defaultCooldownDuration = 3;
        const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;
        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return interaction.reply({
                    content: `Please wait ${timeLeft.toFixed(1)} more seconds before using the \`${command.data.name}\` command again.`,
                    ephemeral: true,
                });
            }
        }
        if (command.data.defaultMemberPermissions) {
            const memberPermissions = interaction.member.permissions;
            const requiredPermissions = command.data.defaultMemberPermissions.toArray();
            const missingPermissions = requiredPermissions.filter(permission => !memberPermissions.has(permission));
            if (missingPermissions.length > 0) {
                return interaction.reply({
                    content: `You do not have the required permissions to use this command: ${missingPermissions.join(', ')}`,
                    ephemeral: true,
                });
            }
        }

        try {
            await command.execute(interaction);
            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
            }
        }
    },
}