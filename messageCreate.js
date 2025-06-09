// Événement messageCreate pour gérer les commandes basées sur le préfixe
const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignorer les messages des bots
        if (message.author.bot) return;
        
        // Récupérer le préfixe du bot
        const prefix = message.client.prefix;
        
        // Vérifier si le message commence par le préfixe
        if (!message.content.startsWith(prefix)) return;
        
        // Extraire les arguments et le nom de la commande
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        // Vérifier si la commande existe
        const command = message.client.commands.get(commandName);
        if (!command) return;
        
        // Vérifier les permissions si nécessaire
        if (command.permissions) {
            const authorPerms = message.channel.permissionsFor(message.author);
            if (!authorPerms || !authorPerms.has(command.permissions)) {
                return message.reply('❌ Vous n\'avez pas les permissions nécessaires pour utiliser cette commande.');
            }
        }
        
        // Exécuter la commande
        try {
            await command.execute(message, args);
        } catch (error) {
            console.error(`Erreur lors de l'exécution de la commande ${commandName}:`, error);
            message.reply('❌ Une erreur s\'est produite lors de l\'exécution de la commande.');
        }
    },
};

