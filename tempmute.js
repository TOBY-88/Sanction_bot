// Commande tempmute pour mute temporairement un utilisateur
const { PermissionFlagsBits, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const roleManager = require('../../utils/roleManager');
const sanctionManager = require('../../utils/sanctionManager');

module.exports = {
    name: 'tempmute',
    description: 'Mute temporairement un utilisateur',
    permissions: [PermissionFlagsBits.ManageRoles],
    async execute(message, args) {
        // Vérifier que la commande est utilisée dans un salon spécifique
        const moderationChannelId = process.env.MODERATION_CHANNEL_ID;
        if (moderationChannelId && message.channel.id !== moderationChannelId) {
            return message.reply("❌ Cette commande ne peut être utilisée que dans le salon de modération.");
        }
        
        // Vérifier que l'utilisateur est mentionné
        const member = message.mentions.members.first();
        if (!member) {
            return message.reply("❌ Veuillez mentionner un utilisateur à mute.");
        }
        
        // Vérifier que l'utilisateur n'est pas le bot lui-même
        if (member.id === message.client.user.id) {
            return message.reply("❌ Je ne peux pas me mute moi-même.");
        }
        
        // Vérifier que l'utilisateur n'est pas le modérateur lui-même
        if (member.id === message.author.id) {
            return message.reply("❌ Vous ne pouvez pas vous mute vous-même.");
        }
        
        // Vérifier que l'utilisateur n'a pas un rôle supérieur ou égal
        if (roleManager.hasEqualOrHigherRole(member, message.member)) {
            return message.reply("❌ Vous ne pouvez pas mute un utilisateur ayant un rôle supérieur ou égal au vôtre.");
        }
        
        // Vérifier que l'utilisateur n'a pas un rôle protégé
        if (roleManager.hasProtectedRole(member)) {
            return message.reply("❌ Cet utilisateur a un rôle protégé et ne peut pas être mute.");
        }
        
        // Stocker temporairement les données pour la sélection
        roleManager.tempMuteData.set(message.author.id, {
            targetId: member.id,
            timestamp: Date.now()
        });
        
        // Créer les menus déroulants pour la durée et la raison
        const durations = roleManager.getAvailableDurations(member);
        const reasons = roleManager.getCommonReasons();
        
        // Créer le sélecteur de durée
        const durationSelect = new StringSelectMenuBuilder()
            .setCustomId('duration_select')
            .setPlaceholder('Sélectionnez une durée')
            .addOptions(durations.map(duration => ({
                label: duration.name,
                value: duration.value
            })));
        
        // Créer le sélecteur de raison
        const reasonSelect = new StringSelectMenuBuilder()
            .setCustomId('reason_select')
            .setPlaceholder('Sélectionnez une raison')
            .addOptions(reasons.map(reason => ({
                label: reason.name,
                value: reason.value
            })));
        
        // Créer les lignes d'action avec les sélecteurs
        const durationRow = new ActionRowBuilder().addComponents(durationSelect);
        const reasonRow = new ActionRowBuilder().addComponents(reasonSelect);
        
        // Envoyer le message avec les sélecteurs
        const response = await message.reply({
            content: `Sélectionnez la durée et la raison du mute pour ${member.toString()}`,
            components: [durationRow, reasonRow]
        });
        
        // Créer le collecteur pour les interactions
        const filter = i => i.user.id === message.author.id && 
                           (i.customId === 'duration_select' || i.customId === 'reason_select');
        
        const collector = response.createMessageComponentCollector({ 
            filter, 
            time: 120000 // 2 minutes
        });
        
        // Variables pour stocker les sélections
        let selectedDuration = null;
        let selectedReason = null;
        
        collector.on('collect', async interaction => {
            // Stocker la sélection
            if (interaction.customId === 'duration_select') {
                selectedDuration = parseInt(interaction.values[0]);
                await interaction.deferUpdate();
            } else if (interaction.customId === 'reason_select') {
                selectedReason = interaction.values[0];
                await interaction.deferUpdate();
            }
            
            // Vérifier si les deux sélections sont faites
            if (selectedDuration !== null && selectedReason !== null) {
                // Vérifier que la raison ne dépasse pas 25 caractères
                if (selectedReason.length > 25) {
                    await interaction.followUp({
                        content: "❌ La raison du mute doit faire 25 caractères maximum.",
                        ephemeral: true
                    });
                    selectedReason = null;
                    return;
                }
                
                // Vérifier que les données temporaires existent toujours
                if (!roleManager.tempMuteData.has(interaction.user.id)) {
                    await interaction.followUp({
                        content: "❌ Les données de mute ont expiré. Veuillez réessayer.",
                        ephemeral: true
                    });
                    return;
                }
                
                // Récupérer l'utilisateur cible
                const targetId = roleManager.tempMuteData.get(interaction.user.id).targetId;
                const target = interaction.guild.members.cache.get(targetId);
                
                if (!target) {
                    await interaction.followUp({
                        content: "❌ L'utilisateur cible n'est plus disponible.",
                        ephemeral: true
                    });
                    return;
                }
                
                // Appliquer le mute
                try {
                    // Ajouter le rôle muted
                    const mutedRole = await roleManager.addMutedRole(target);
                    
                    // Enregistrer la sanction
                    const sanctionId = sanctionManager.addSanction(
                        interaction.guild.id,
                        target.id,
                        "Mute",
                        selectedReason,
                        interaction.user.id,
                        selectedDuration
                    );
                    
                    // Envoyer un message privé à l'utilisateur
                    try {
                        const embed = new EmbedBuilder()
                            .setTitle("Vous avez été mute")
                            .setDescription(`Vous avez été mute sur le serveur **${interaction.guild.name}**`)
                            .setColor(0x000000) // Noir
                            .addFields(
                                { name: "Raison", value: selectedReason, inline: false },
                                { name: "Durée", value: `${selectedDuration} minutes`, inline: false }
                            );
                        
                        await target.send({ embeds: [embed] });
                    } catch (error) {
                        // L'utilisateur a peut-être désactivé les messages privés
                        console.error(`Impossible d'envoyer un MP à ${target.user.tag}:`, error);
                    }
                    
                    // Confirmer le mute
                    await interaction.followUp({
                        content: `✅ ${target.toString()} a été mute pendant ${selectedDuration} minutes pour: ${selectedReason}`
                    });
                    
                    // Planifier l'unmute
                    setTimeout(async () => {
                        try {
                            // Vérifier si l'utilisateur est toujours sur le serveur
                            const guildMember = interaction.guild.members.cache.get(target.id);
                            if (guildMember) {
                                // Retirer le rôle muted et restaurer les anciens rôles
                                await roleManager.removeMutedRole(guildMember);
                                
                                // Envoyer un message privé à l'utilisateur
                                try {
                                    await guildMember.send(`Votre mute sur le serveur **${interaction.guild.name}** est terminé.`);
                                } catch (error) {
                                    // L'utilisateur a peut-être désactivé les messages privés
                                    console.error(`Impossible d'envoyer un MP à ${guildMember.user.tag}:`, error);
                                }
                            }
                        } catch (error) {
                            console.error(`Erreur lors de l'unmute automatique de ${target.user.tag}:`, error);
                        }
                    }, selectedDuration * 60 * 1000); // Convertir en millisecondes
                    
                } catch (error) {
                    console.error(`Erreur lors du mute de ${target.user.tag}:`, error);
                    await interaction.followUp({
                        content: `❌ Erreur lors du mute: ${error.message}`
                    });
                }
                
                // Supprimer le message d'interaction
                try {
                    await response.delete();
                } catch (error) {
                    console.error('Impossible de supprimer le message:', error);
                }
                
                // Nettoyer les données temporaires
                roleManager.tempMuteData.delete(interaction.user.id);
                
                // Arrêter le collecteur
                collector.stop();
            }
        });
        
        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                // L'interaction a expiré
                try {
                    await response.edit({
                        content: "❌ L'interaction a expiré. Veuillez réessayer.",
                        components: []
                    });
                    
                    // Nettoyer les données temporaires
                    if (roleManager.tempMuteData.has(message.author.id)) {
                        roleManager.tempMuteData.delete(message.author.id);
                    }
                    
                    // Supprimer le message après quelques secondes
                    setTimeout(async () => {
                        try {
                            await response.delete();
                        } catch (error) {
                            console.error('Impossible de supprimer le message:', error);
                        }
                    }, 5000);
                } catch (error) {
                    console.error('Impossible de mettre à jour le message:', error);
                }
            }
        });
    },
};

