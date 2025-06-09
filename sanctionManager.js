// Gestionnaire de sanctions pour le bot de modération
const fs = require('fs-extra');
const path = require('path');

class SanctionManager {
    constructor() {
        this.sanctionsFile = path.join(__dirname, '../data/sanction.json');
        this.warningsFile = path.join(__dirname, '../data/atcd.json');
        this.ensureDataFiles();
    }

    /**
     * S'assure que les fichiers de données existent
     */
    ensureDataFiles() {
        fs.ensureDirSync(path.join(__dirname, '../data'));
        
        if (!fs.existsSync(this.sanctionsFile)) {
            fs.writeJsonSync(this.sanctionsFile, {}, { spaces: 2 });
        }
        
        if (!fs.existsSync(this.warningsFile)) {
            fs.writeJsonSync(this.warningsFile, {}, { spaces: 2 });
        }
    }

    /**
     * Charge les sanctions depuis le fichier JSON
     * @returns {Object} - Les sanctions
     */
    loadSanctions() {
        try {
            return fs.readJsonSync(this.sanctionsFile);
        } catch (error) {
            console.error('Erreur lors du chargement des sanctions:', error);
            return {};
        }
    }

    /**
     * Sauvegarde les sanctions dans le fichier JSON
     * @param {Object} data - Les sanctions à sauvegarder
     */
    saveSanctions(data) {
        try {
            fs.writeJsonSync(this.sanctionsFile, data, { spaces: 2 });
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des sanctions:', error);
        }
    }

    /**
     * Charge les avertissements depuis le fichier JSON
     * @returns {Object} - Les avertissements
     */
    loadWarnings() {
        try {
            return fs.readJsonSync(this.warningsFile);
        } catch (error) {
            console.error('Erreur lors du chargement des avertissements:', error);
            return {};
        }
    }

    /**
     * Sauvegarde les avertissements dans le fichier JSON
     * @param {Object} data - Les avertissements à sauvegarder
     */
    saveWarnings(data) {
        try {
            fs.writeJsonSync(this.warningsFile, data, { spaces: 2 });
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des avertissements:', error);
        }
    }

    /**
     * Ajoute une sanction dans le fichier JSON
     * @param {string} guildId - ID du serveur
     * @param {string} userId - ID de l'utilisateur sanctionné
     * @param {string} sanctionType - Type de sanction (Mute, Warn, etc.)
     * @param {string} reason - Raison de la sanction
     * @param {string} moderatorId - ID du modérateur qui a appliqué la sanction
     * @param {number} duration - Durée de la sanction en minutes (pour les mutes)
     * @returns {number} - ID de la sanction
     */
    addSanction(guildId, userId, sanctionType, reason, moderatorId, duration = null) {
        const sanctions = this.loadSanctions();
        
        // Initialiser les structures si elles n'existent pas
        if (!sanctions[guildId]) {
            sanctions[guildId] = {};
        }
        
        if (!sanctions[guildId][userId]) {
            sanctions[guildId][userId] = [];
        }
        
        // Créer la nouvelle sanction
        const now = new Date();
        const sanction = {
            id: sanctions[guildId][userId].length + 1,
            type: sanctionType,
            reason: reason,
            moderatorId: moderatorId,
            timestamp: now.getTime(),
            date: now.toLocaleString('fr-FR')
        };
        
        // Ajouter la durée si c'est un mute
        if (duration !== null) {
            sanction.duration = duration;
        }
        
        // Ajouter la sanction à la liste
        sanctions[guildId][userId].push(sanction);
        
        // Sauvegarder les modifications
        this.saveSanctions(sanctions);
        
        return sanction.id;
    }

    /**
     * Ajoute un avertissement dans le fichier atcd.json
     * @param {string} guildId - ID du serveur
     * @param {string} userId - ID de l'utilisateur averti
     * @param {string} reason - Raison de l'avertissement
     * @param {string} moderatorId - ID du modérateur qui a donné l'avertissement
     * @returns {number} - Numéro de l'avertissement
     */
    addWarning(guildId, userId, reason, moderatorId) {
        const warnings = this.loadWarnings();
        
        // Initialiser les structures si elles n'existent pas
        if (!warnings[guildId]) {
            warnings[guildId] = {};
        }
        
        if (!warnings[guildId][userId]) {
            warnings[guildId][userId] = [];
        }
        
        // Créer le nouvel avertissement
        const now = new Date();
        const warning = {
            id: warnings[guildId][userId].length + 1,
            reason: reason,
            moderatorId: moderatorId,
            timestamp: now.getTime(),
            date: now.toLocaleString('fr-FR')
        };
        
        // Ajouter l'avertissement à la liste
        warnings[guildId][userId].push(warning);
        
        // Sauvegarder les modifications
        this.saveWarnings(warnings);
        
        return warning.id;
    }

    /**
     * Récupère les sanctions d'un utilisateur
     * @param {string} guildId - ID du serveur
     * @param {string} userId - ID de l'utilisateur
     * @returns {Array} - Liste des sanctions de l'utilisateur
     */
    getUserSanctions(guildId, userId) {
        const sanctions = this.loadSanctions();
        
        // Vérifier si les structures existent
        if (!sanctions[guildId] || !sanctions[guildId][userId]) {
            return [];
        }
        
        return sanctions[guildId][userId];
    }

    /**
     * Récupère les avertissements d'un utilisateur
     * @param {string} guildId - ID du serveur
     * @param {string} userId - ID de l'utilisateur
     * @returns {Array} - Liste des avertissements de l'utilisateur
     */
    getUserWarnings(guildId, userId) {
        const warnings = this.loadWarnings();
        
        // Vérifier si les structures existent
        if (!warnings[guildId] || !warnings[guildId][userId]) {
            return [];
        }
        
        return warnings[guildId][userId];
    }

    /**
     * Récupère toutes les sanctions et avertissements d'un utilisateur
     * @param {string} guildId - ID du serveur
     * @param {string} userId - ID de l'utilisateur
     * @returns {Array} - Liste combinée des sanctions et avertissements de l'utilisateur, triée par date
     */
    getAllSanctions(guildId, userId) {
        const sanctions = this.getUserSanctions(guildId, userId);
        const warnings = this.getUserWarnings(guildId, userId);
        
        // Combiner les deux listes
        const allSanctions = [...sanctions, ...warnings];
        
        // Trier par date (timestamp)
        allSanctions.sort((a, b) => b.timestamp - a.timestamp);
        
        return allSanctions;
    }
}

module.exports = new SanctionManager();

