// Commande warn pour avertir un utilisateur
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const roleManager = require('../../utils/roleManager');
const sanctionManager = require('../../utils/sanctionManager');

module.exports = {
    name: 'warn',
    description: 'Avertir un utilisateur',
    permissions: [PermissionFlagsBits.ManageMessages],
    async execute(message, args) {
        // Vérifier que l'utilisateur est mentionné
        const member = message.mentions.members.first();
        if (!member) {
            return message.reply("❌ Veuillez mentionner un utilisateur à avertir.");
        }
        
        // Vérifier que l'utilisateur n'est pas le bot lui-même
        if (member.id === message.client.user.id) {
            return message.reply("❌ Je ne peux pas m'avertir moi-même.");
        }
        
        // Vérifier que l'utilisateur n'est pas le modérateur lui-même
        if (member.id === message.author.id) {
            return message.reply("❌ Vous ne pouvez pas vous avertir vous-même.");
        }
        
        // Vérifier que l'utilisateur n'a pas un rôle supérieur ou égal
        if (roleManager.hasEqualOrHigherRole(member, message.member)) {
            return message.reply("❌ Vous ne pouvez pas avertir un utilisateur ayant un rôle supérieur ou égal au vôtre.");
        }
        
        // Vérifier que l'utilisateur n'a pas un rôle protégé
        if (roleManager.hasProtectedRole(member)) {
            return message.reply("❌ Cet utilisateur a un rôle protégé et ne peut pas être averti.");
        }
        
        // Récupérer la raison
        const reason = args.slice(1).join(' ') || "Aucune raison donnée";
        
        // Enregistrer l'avertissement
        const warningId = sanctionManager.addWarning(
            message.guild.id,
            member.id,
            reason,
            message.author.id
        );
        
        // Envoyer un message privé à l'utilisateur
        let dmSent = true;
        try {
            const embed = new EmbedBuilder()
                .setTitle("Vous avez reçu un avertissement")
                .setDescription(`Vous avez reçu un avertissement sur le serveur **${message.guild.name}**`)
                .setColor(0x000000) // Noir
                .addFields(
                    { name: "Raison", value: reason, inline: false },
                    { name: "Avertissement #", value: warningId.toString(), inline: false }
                );
            
            await member.send({ embeds: [embed] });
        } catch (error) {
            // L'utilisateur a peut-être désactivé les messages privés
            console.error(`Impossible d'envoyer un MP à ${member.user.tag}:`, error);
            dmSent = false;
        }
        
        // Confirmer l'avertissement
        return message.reply(
            `✅ ${member.toString()} a reçu un avertissement (#${warningId}) pour: ${reason}` + 
            (dmSent ? "" : "\n⚠️ Note: L'utilisateur n'a pas pu recevoir de message privé.")
        );
    },
};

