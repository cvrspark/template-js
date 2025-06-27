const { Events } = require('discord.js');
const timesJoin = require('../utils/memberData/timesJoin.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        if (member.user.bot) {
            return;
        }

        const current = timesJoin.get(member.id);

        if (current === undefined) {
            timesJoin.set(member.id, 0);
        } else {
            timesJoin.increase(member.id);
        }

        const roleId = '1387837320140427295';
        try {
            await member.roles.add(roleId);
        } catch (error) {
            console.error(`Failed to add role to ${member.user.tag}:`, error);
        }
    }
}