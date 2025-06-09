// Commande unmute pour retirer le mute d'un utilisateur
const { PermissionFlagsBits } = require('discord.js');
const roleManager = require('../../utils/roleManager');

module.exports = {
    name: 'unmute',
    description: 'Retire le mute d\'un utilisateur',
    permissions: [PermissionFlagsBits.ManageRoles],
    async execute(message, args) {
        // Vérifier que l'utilisateur est mentionné
        const member = message.mentions.members.first();
        if (!member) {
            return message.reply("❌ Veuillez mentionner un utilisateur à unmute.");
        }
        
        // Vérifier si l'utilisateur a le rôle muted
        const mutedRoleId = process.env.MUTED_ROLE_ID || '0';
        const mutedRole = message.guild.roles.cache.get(mutedRoleId);
        
        if (!mutedRole || !member.roles.cache.has(mutedRole.id)) {
            return message.reply(`❌ ${member.toString()} n'est pas mute.`);
        }
        
        // Retirer le rôle muted et restaurer les anciens rôles
        const success = await roleManager.removeMutedRole(member);
        
        if (success) {
            // Envoyer un message privé à l'utilisateur
            try {
                await member.send(`Votre mute sur le serveur **${message.guild.name}** a été retiré par un modérateur.`);
            } catch (error) {
                // L'utilisateur a peut-être désactivé les messages privés
                console.error(`Impossible d'envoyer un MP à ${member.user.tag}:`, error);
            }
            
            return message.reply(`✅ ${member.toString()} a été unmute.`);
        } else {
            return message.reply(`❌ Impossible de unmute ${member.toString()}. Aucune donnée de rôle précédente trouvée.`);
        }
    },
};

