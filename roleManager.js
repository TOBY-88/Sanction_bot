// Gestionnaire de rôles pour le bot de modération
const { PermissionsBitField } = require('discord.js');

class RoleManager {
    constructor() {
        this.mutedRoleId = process.env.MUTED_ROLE_ID || '0';
        this.protectedRoles = process.env.PROTECTED_ROLES ? process.env.PROTECTED_ROLES.split(',') : [];
        this.specialRoles = process.env.SPECIAL_ROLES ? process.env.SPECIAL_ROLES.split(',') : [];
        this.tempMuteData = new Map(); // Pour stocker temporairement les données de mute
    }

    /**
     * Vérifie si member1 a un rôle supérieur à member2
     * @param {GuildMember} member1 - Le membre qui effectue l'action
     * @param {GuildMember} member2 - Le membre ciblé par l'action
     * @returns {boolean} - True si member1 peut modérer member2, False sinon
     */
    hasHigherRole(member1, member2) {
        // Les administrateurs peuvent modérer tout le monde sauf les autres administrateurs
        if (member1.permissions.has(PermissionsBitField.Flags.Administrator) && 
            !member2.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return true;
        }
        
        // Les administrateurs ne peuvent pas être modérés par des non-administrateurs
        if (member2.permissions.has(PermissionsBitField.Flags.Administrator) && 
            !member1.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return false;
        }
        
        // Vérification basée sur la position des rôles
        return member1.roles.highest.position > member2.roles.highest.position;
    }

    /**
     * Vérifie si member1 a un rôle supérieur ou égal à member2
     * @param {GuildMember} member1 - Le membre qui effectue l'action
     * @param {GuildMember} member2 - Le membre ciblé par l'action
     * @returns {boolean} - True si member1 a un rôle supérieur ou égal, False sinon
     */
    hasEqualOrHigherRole(member1, member2) {
        // Les administrateurs peuvent modérer tout le monde sauf les autres administrateurs
        if (member1.permissions.has(PermissionsBitField.Flags.Administrator) && 
            !member2.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return true;
        }
        
        // Les administrateurs ne peuvent pas être modérés par des non-administrateurs
        if (member2.permissions.has(PermissionsBitField.Flags.Administrator) && 
            !member1.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return false;
        }
        
        // Vérification basée sur la position des rôles
        return member1.roles.highest.position >= member2.roles.highest.position;
    }

    /**
     * Vérifie si le membre a un rôle protégé
     * @param {GuildMember} member - Le membre à vérifier
     * @returns {boolean} - True si le membre a un rôle protégé, False sinon
     */
    hasProtectedRole(member) {
        return member.roles.cache.some(role => this.protectedRoles.includes(role.id));
    }

    /**
     * Ajoute le rôle Muted à un membre
     * @param {GuildMember} member - Le membre à mute
     * @returns {Promise<Role>} - Le rôle Muted
     */
    async addMutedRole(member) {
        const guild = member.guild;
        let mutedRole = guild.roles.cache.get(this.mutedRoleId);
        
        if (!mutedRole) {
            // Créer le rôle Muted s'il n'existe pas
            mutedRole = await guild.roles.create({
                name: "Muted",
                reason: "Création automatique du rôle Muted",
                permissions: []
            });
            
            // Configurer les permissions pour empêcher d'envoyer des messages
            for (const channel of guild.channels.cache.values()) {
                try {
                    await channel.permissionOverwrites.create(mutedRole, {
                        SendMessages: false,
                        AddReactions: false
                    });
                } catch (error) {
                    console.error(`Impossible de configurer les permissions pour le canal ${channel.name}:`, error);
                }
            }
            
            // Mettre à jour l'ID du rôle Muted
            this.mutedRoleId = mutedRole.id;
        }
        
        // Sauvegarder les rôles actuels du membre
        this.tempMuteData.set(member.id, {
            roles: member.roles.cache.filter(role => role.id !== guild.id).map(role => role.id), // Exclure @everyone
            timestamp: Date.now()
        });
        
        // Retirer tous les rôles et ajouter le rôle Muted
        const rolesToRemove = member.roles.cache.filter(role => role.id !== guild.id); // Exclure @everyone
        
        try {
            // Retirer tous les rôles
            await member.roles.remove(rolesToRemove, "Mute temporaire");
            
            // Ajouter le rôle Muted
            await member.roles.add(mutedRole, "Mute temporaire");
        } catch (error) {
            console.error(`Erreur lors de l'ajout du rôle Muted à ${member.user.tag}:`, error);
        }
        
        return mutedRole;
    }

    /**
     * Retire le rôle Muted et restaure les anciens rôles
     * @param {GuildMember} member - Le membre à unmute
     * @returns {Promise<boolean>} - True si l'unmute a réussi, False sinon
     */
    async removeMutedRole(member) {
        const guild = member.guild;
        const mutedRole = guild.roles.cache.get(this.mutedRoleId);
        
        if (mutedRole && member.roles.cache.has(mutedRole.id)) {
            await member.roles.remove(mutedRole, "Fin du mute temporaire");
        }
        
        // Restaurer les anciens rôles si disponibles
        if (this.tempMuteData.has(member.id)) {
            const userData = this.tempMuteData.get(member.id);
            const rolesToAdd = [];
            
            for (const roleId of userData.roles) {
                const role = guild.roles.cache.get(roleId);
                if (role) {
                    rolesToAdd.push(role);
                }
            }
            
            if (rolesToAdd.length > 0) {
                try {
                    await member.roles.add(rolesToAdd, "Restauration des rôles après mute");
                } catch (error) {
                    console.error(`Erreur lors de la restauration des rôles de ${member.user.tag}:`, error);
                    return false;
                }
            }
            
            // Nettoyer les données temporaires
            this.tempMuteData.delete(member.id);
            
            return true;
        }
        
        return false;
    }

    /**
     * Retourne les durées disponibles pour le mute en fonction des rôles du membre
     * @param {GuildMember} member - Le membre à mute
     * @returns {Array} - Les durées disponibles
     */
    getAvailableDurations(member) {
        // Durées de base
        const durations = [
            { name: "5 minutes", value: "5" },
            { name: "10 minutes", value: "10" },
            { name: "20 minutes", value: "20" },
            { name: "1 heure", value: "60" },
            { name: "3 heures", value: "180" },
            { name: "6 heures", value: "360" },
            { name: "12 heures", value: "720" }
        ];
        
        // Ajouter 24h pour les membres avec certains rôles spéciaux
        if (member.roles.cache.some(role => this.specialRoles.includes(role.id))) {
            durations.push({ name: "24 heures", value: "1440" });
        }
        
        return durations;
    }

    /**
     * Retourne les raisons communes pour le mute
     * @returns {Array} - Les raisons communes
     */
    getCommonReasons() {
        return [
            { name: "Spam", value: "Spam" },
            { name: "Insultes", value: "Insultes" },
            { name: "Contenu inapproprié", value: "Contenu inapproprié" },
            { name: "Publicité non autorisée", value: "Publicité non autorisée" },
            { name: "Harcèlement", value: "Harcèlement" },
            { name: "Autre", value: "Autre" }
        ];
    }
}

module.exports = new RoleManager();

