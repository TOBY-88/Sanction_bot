// Commande sanction pour afficher les sanctions d'un utilisateur
const { PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const sanctionManager = require('../../utils/sanctionManager');

module.exports = {
    name: 'sanction',
    description: 'Afficher les sanctions d\'un utilisateur',
    permissions: [PermissionFlagsBits.ManageMessages],
    async execute(message, args) {
        // Vérifier que l'utilisateur est mentionné
        const member = message.mentions.members.first();
        if (!member) {
            return message.reply("❌ Veuillez mentionner un utilisateur.");
        }
        
        // Récupérer toutes les sanctions de l'utilisateur
        const allSanctions = sanctionManager.getAllSanctions(message.guild.id, member.id);
        
        if (allSanctions.length === 0) {
            return message.reply(`✅ ${member.toString()} n'a aucune sanction.`);
        }
        
        // Créer un système de pagination pour afficher 8 sanctions par page
        const sanctionsPerPage = 8;
        const totalPages = Math.ceil(allSanctions.length / sanctionsPerPage);
        let currentPage = 0;
        
        // Fonction pour créer l'embed de la page actuelle
        const createEmbed = (page) => {
            const startIdx = page * sanctionsPerPage;
            const endIdx = Math.min(startIdx + sanctionsPerPage, allSanctions.length);
            
            const embed = new EmbedBuilder()
                .setTitle(`Sanctions de ${member.displayName}`)
                .setDescription(`Page ${page + 1}/${totalPages}`)
                .setColor(0x3498db);
            
            for (let i = startIdx; i < endIdx; i++) {
                const sanction = allSanctions[i];
                
                // Déterminer le type de sanction
                const sanctionType = sanction.type || "Avertissement";
                
                // Récupérer le modérateur
                const moderatorId = sanction.moderatorId || "0";
                const moderator = message.guild.members.cache.get(moderatorId);
                const moderatorName = moderator ? moderator.displayName : "Modérateur inconnu";
                
                // Créer le titre du champ
                const fieldTitle = `${sanctionType} #${sanction.id || (i + 1)}`;
                
                // Créer le contenu du champ
                let fieldContent = `**Raison :** ${sanction.reason || "Non spécifiée"}\n`;
                fieldContent += `**Modérateur :** ${moderatorName}\n`;
                fieldContent += `**Date :** ${sanction.date || "Inconnue"}`;
                
                // Ajouter la durée si c'est un mute
                if (sanctionType === "Mute" && sanction.duration) {
                    fieldContent += `\n**Durée :** ${sanction.duration} minutes`;
                }
                
                embed.addFields({ name: fieldTitle, value: fieldContent, inline: false });
            }
            
            return embed;
        };
        
        // Créer les boutons de navigation
        const previousButton = new ButtonBuilder()
            .setCustomId('previous')
            .setLabel('◀️ Précédent')
            .setStyle(ButtonStyle.Secondary);
        
        const nextButton = new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Suivant ▶️')
            .setStyle(ButtonStyle.Secondary);
        
        const row = new ActionRowBuilder().addComponents(previousButton, nextButton);
        
        // Envoyer le message avec l'embed et les boutons
        const response = await message.reply({
            embeds: [createEmbed(currentPage)],
            components: [row]
        });
        
        // Créer le collecteur pour les interactions
        const filter = i => i.user.id === message.author.id && 
                           (i.customId === 'previous' || i.customId === 'next');
        
        const collector = response.createMessageComponentCollector({ 
            filter, 
            time: 120000 // 2 minutes
        });
        
        collector.on('collect', async interaction => {
            // Mettre à jour la page
            if (interaction.customId === 'previous') {
                currentPage = (currentPage - 1 + totalPages) % totalPages;
            } else if (interaction.customId === 'next') {
                currentPage = (currentPage + 1) % totalPages;
            }
            
            // Mettre à jour l'embed
            await interaction.update({
                embeds: [createEmbed(currentPage)],
                components: [row]
            });
        });
        
        collector.on('end', async () => {
            // Désactiver les boutons après l'expiration
            previousButton.setDisabled(true);
            nextButton.setDisabled(true);
            
            const disabledRow = new ActionRowBuilder().addComponents(previousButton, nextButton);
            
            try {
                await response.edit({
                    embeds: [createEmbed(currentPage)],
                    components: [disabledRow]
                });
            } catch (error) {
                console.error('Impossible de mettre à jour le message:', error);
            }
        });
    },
};

