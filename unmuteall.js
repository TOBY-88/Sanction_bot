// Commande unmuteall pour retirer le mute de tous les utilisateurs
const { PermissionFlagsBits } = require('discord.js');
const roleManager = require('../../utils/roleManager');

module.exports = {
    name: 'unmuteall',
    description: 'Retire le mute de tous les utilisateurs mute',
    permissions: [PermissionFlagsBits.Administrator],
    async execute(message, args) {
        // Récupérer le rôle muted
        const mutedRoleId = process.env.MUTED_ROLE_ID || '0';
        const mutedRole = message.guild.roles.cache.get(mutedRoleId);
        
        if (!mutedRole) {
            return message.reply("❌ Le rôle Muted n'existe pas.");
        }
        
        // Récupérer tous les membres avec le rôle muted
        const mutedMembers = message.guild.members.cache.filter(member => member.roles.cache.has(mutedRole.id));
        
        if (mutedMembers.size === 0) {
            return message.reply("✅ Aucun utilisateur n'est actuellement mute.");
        }
        
        // Unmute chaque membre
        let unmutedCount = 0;
        const statusMessage = await message.reply(`⏳ Unmute de ${mutedMembers.size} utilisateur(s) en cours...`);
        
        for (const [id, member] of mutedMembers) {
            const success = await roleManager.removeMutedRole(member);
            
            if (success) {
                // Envoyer un message privé à l'utilisateur
                try {
                    await member.send(`Votre mute sur le serveur **${message.guild.name}** a été retiré par un administrateur.`);
                } catch (error) {
                    // L'utilisateur a peut-être désactivé les messages privés
                    console.error(`Impossible d'envoyer un MP à ${member.user.tag}:`, error);
                }
                
                unmutedCount++;
            }
        }
        
        return statusMessage.edit(`✅ ${unmutedCount} utilisateur(s) ont été unmute.`);
    },
};

