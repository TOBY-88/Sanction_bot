// Charger les variables d'environnement
require('dotenv').config();

// Importer les modules nécessaires
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Configuration du client Discord avec les intents nécessaires
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Stocker les commandes dans une collection
client.commands = new Collection();
client.prefix = process.env.COMMAND_PREFIX || '-';

// Charger les événements
const eventsPath = path.join(__dirname, 'src/events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Charger les commandes
const commandsPath = path.join(__dirname, 'src/commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (fs.statSync(folderPath).isDirectory()) {
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);
            if ('name' in command && 'execute' in command) {
                client.commands.set(command.name, command);
            }
        }
    }
}

// Connexion à Discord
client.login(process.env.BOT_TOKEN)
    .then(() => console.log('Bot connecté!'))
    .catch(error => console.error('Erreur de connexion:', error));

// Gestion des erreurs non gérées
process.on('unhandledRejection', error => {
    console.error('Erreur non gérée:', error);
});

