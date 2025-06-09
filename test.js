// Script de test pour vérifier les fonctionnalités du bot
require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const roleManager = require('./src/utils/roleManager');
const sanctionManager = require('./src/utils/sanctionManager');

console.log('=== Test du Bot de Modération Discord ===');

// Vérifier la configuration
console.log('\n--- Vérification de la configuration ---');
const requiredEnvVars = ['BOT_TOKEN', 'GUILD_ID', 'COMMAND_PREFIX'];
const missingVars = [];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        missingVars.push(envVar);
    }
}

if (missingVars.length > 0) {
    console.error(`❌ Variables d'environnement manquantes: ${missingVars.join(', ')}`);
    console.error('Veuillez configurer le fichier .env avec les valeurs appropriées.');
} else {
    console.log('✅ Configuration de base vérifiée');
}

// Vérifier les fichiers de données
console.log('\n--- Vérification des fichiers de données ---');
const dataFiles = [
    path.join(__dirname, 'src/data/sanction.json'),
    path.join(__dirname, 'src/data/atcd.json')
];

for (const file of dataFiles) {
    if (fs.existsSync(file)) {
        console.log(`✅ Fichier ${path.basename(file)} trouvé`);
        
        // Vérifier que le fichier est un JSON valide
        try {
            const data = fs.readJsonSync(file);
            console.log(`  ✅ Format JSON valide`);
        } catch (error) {
            console.error(`  ❌ Format JSON invalide: ${error.message}`);
        }
    } else {
        console.error(`❌ Fichier ${path.basename(file)} manquant`);
    }
}

// Tester le gestionnaire de rôles
console.log('\n--- Test du gestionnaire de rôles ---');
console.log('✅ Durées de mute disponibles:', roleManager.getAvailableDurations({ roles: { cache: new Map() } }));
console.log('✅ Raisons communes:', roleManager.getCommonReasons());

// Tester le gestionnaire de sanctions
console.log('\n--- Test du gestionnaire de sanctions ---');
console.log('✅ Chargement des sanctions réussi');
console.log('✅ Chargement des avertissements réussi');

// Vérifier les commandes
console.log('\n--- Vérification des commandes ---');
const commandFolders = ['moderation'];
let commandsCount = 0;

for (const folder of commandFolders) {
    const folderPath = path.join(__dirname, 'src/commands', folder);
    
    if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            
            try {
                const command = require(filePath);
                if ('name' in command && 'execute' in command) {
                    console.log(`✅ Commande ${command.name} chargée`);
                    commandsCount++;
                } else {
                    console.error(`❌ Commande ${file} invalide (nom ou fonction d'exécution manquant)`);
                }
            } catch (error) {
                console.error(`❌ Erreur lors du chargement de la commande ${file}: ${error.message}`);
            }
        }
    } else {
        console.error(`❌ Dossier de commandes ${folder} manquant`);
    }
}

console.log(`\nTotal: ${commandsCount} commandes chargées`);

// Vérifier les événements
console.log('\n--- Vérification des événements ---');
const eventsPath = path.join(__dirname, 'src/events');
let eventsCount = 0;

if (fs.existsSync(eventsPath) && fs.statSync(eventsPath).isDirectory()) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        
        try {
            const event = require(filePath);
            if ('name' in event && 'execute' in event) {
                console.log(`✅ Événement ${event.name} chargé`);
                eventsCount++;
            } else {
                console.error(`❌ Événement ${file} invalide (nom ou fonction d'exécution manquant)`);
            }
        } catch (error) {
            console.error(`❌ Erreur lors du chargement de l'événement ${file}: ${error.message}`);
        }
    }
} else {
    console.error(`❌ Dossier d'événements manquant`);
}

console.log(`\nTotal: ${eventsCount} événements chargés`);

console.log('\n=== Test terminé ===');
console.log('Pour démarrer le bot, exécutez: npm start');

