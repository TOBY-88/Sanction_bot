// Événement ready pour indiquer quand le bot est prêt
const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`${client.user.tag} est connecté et prêt!`);
        console.log(`Connecté à ${client.guilds.cache.size} serveur(s)`);
    },
};

