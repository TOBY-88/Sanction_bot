# Guide d'Installation et d'Utilisation du Bot de Modération Discord

## Table des matières
1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Démarrage du bot](#démarrage-du-bot)
5. [Commandes disponibles](#commandes-disponibles)
6. [Dépannage](#dépannage)
7. [FAQ](#faq)

## Prérequis

Avant d'installer le bot, assurez-vous d'avoir :

- Node.js (version 16.9.0 ou supérieure)
- npm (généralement installé avec Node.js)
- Un compte Discord et un serveur où vous avez les permissions d'administrateur
- Un bot Discord créé sur le [Portail des développeurs Discord](https://discord.com/developers/applications)

## Installation

1. Téléchargez les fichiers du bot depuis le dépôt fourni.

2. Ouvrez un terminal et naviguez jusqu'au dossier du bot :
   ```bash
   cd chemin/vers/discord-moderation-bot-js
   ```

3. Installez les dépendances nécessaires :
   ```bash
   npm install
   ```

## Configuration

1. Créez un fichier `.env` à la racine du projet en copiant le fichier `.env.example` :
   ```bash
   cp .env.example .env
   ```

2. Ouvrez le fichier `.env` avec un éditeur de texte et remplissez les informations suivantes :

   ```
   # Configuration du bot Discord
   BOT_TOKEN=votre_token_bot_ici
   GUILD_ID=id_de_votre_serveur
   MUTED_ROLE_ID=id_du_role_muted
   MODERATION_CHANNEL_ID=id_du_salon_moderation

   # Rôles protégés (séparés par des virgules)
   PROTECTED_ROLES=123456789,987654321

   # Rôles spéciaux pour les durées de mute étendues (séparés par des virgules)
   SPECIAL_ROLES=123456789,987654321

   # Préfixe des commandes
   COMMAND_PREFIX=-
   ```

   ### Comment obtenir ces informations :

   - **BOT_TOKEN** : Disponible sur le [Portail des développeurs Discord](https://discord.com/developers/applications) dans la section "Bot" de votre application.
   
   - **GUILD_ID** : Activez le mode développeur dans Discord (Paramètres > Avancés > Mode développeur), puis faites un clic droit sur votre serveur et sélectionnez "Copier l'identifiant".
   
   - **MUTED_ROLE_ID** : Si vous avez déjà un rôle "Muted", faites un clic droit dessus et sélectionnez "Copier l'identifiant". Sinon, laissez vide et le bot en créera un automatiquement.
   
   - **MODERATION_CHANNEL_ID** : Faites un clic droit sur le salon de modération et sélectionnez "Copier l'identifiant".
   
   - **PROTECTED_ROLES** : IDs des rôles qui ne peuvent pas être mute, séparés par des virgules.
   
   - **SPECIAL_ROLES** : IDs des rôles qui ont accès à des durées de mute supplémentaires (24h), séparés par des virgules.
   
   - **COMMAND_PREFIX** : Le préfixe que vous souhaitez utiliser pour les commandes du bot (par défaut : `-`).

## Démarrage du bot

1. Une fois la configuration terminée, démarrez le bot avec la commande :
   ```bash
   npm start
   ```

2. Si tout est correctement configuré, vous devriez voir dans la console :
   ```
   [Nom du bot] est connecté et prêt!
   Connecté à [nombre] serveur(s)
   ```

3. Invitez le bot sur votre serveur si ce n'est pas déjà fait, en utilisant le lien d'invitation généré dans le portail des développeurs Discord.

## Commandes disponibles

### Commande `-tempmute`

**Usage** : `-tempmute @utilisateur`

**Description** : Mute temporairement un utilisateur en lui retirant tous ses rôles et en lui attribuant le rôle "Muted".

**Fonctionnement** :
1. Mentionnez l'utilisateur à mute après la commande.
2. Un menu déroulant apparaîtra pour sélectionner la durée du mute.
3. Un second menu déroulant apparaîtra pour sélectionner la raison du mute.
4. Une fois les deux sélections faites, l'utilisateur sera mute pour la durée spécifiée.
5. L'utilisateur recevra un message privé l'informant du mute.
6. À la fin de la durée, l'utilisateur sera automatiquement unmute et ses rôles seront restaurés.

**Restrictions** :
- Vous ne pouvez pas mute un utilisateur ayant un rôle supérieur ou égal au vôtre.
- Vous ne pouvez pas mute un utilisateur ayant un rôle protégé.
- La raison du mute doit faire 25 caractères maximum.
- La commande ne peut être utilisée que dans le salon de modération configuré.

### Commande `-unmute`

**Usage** : `-unmute @utilisateur`

**Description** : Retire manuellement le mute d'un utilisateur et restaure ses rôles précédents.

**Fonctionnement** :
1. Mentionnez l'utilisateur à unmute après la commande.
2. Le bot retirera le rôle "Muted" et restaurera les rôles précédents de l'utilisateur.
3. L'utilisateur recevra un message privé l'informant qu'il a été unmute.

### Commande `-unmuteall`

**Usage** : `-unmuteall`

**Description** : Retire le mute de tous les utilisateurs actuellement mute sur le serveur.

**Fonctionnement** :
1. Le bot identifie tous les utilisateurs ayant le rôle "Muted".
2. Il retire le rôle "Muted" et restaure les rôles précédents de chaque utilisateur.
3. Chaque utilisateur recevra un message privé l'informant qu'il a été unmute.

**Restrictions** :
- Cette commande ne peut être utilisée que par les administrateurs du serveur.

### Commande `-warn`

**Usage** : `-warn @utilisateur [raison]`

**Description** : Donne un avertissement à un utilisateur.

**Fonctionnement** :
1. Mentionnez l'utilisateur à avertir après la commande.
2. Spécifiez la raison de l'avertissement (optionnel).
3. L'utilisateur recevra un message privé l'informant de l'avertissement.
4. L'avertissement sera enregistré dans le système.

**Restrictions** :
- Vous ne pouvez pas avertir un utilisateur ayant un rôle supérieur ou égal au vôtre.
- Vous ne pouvez pas avertir un utilisateur ayant un rôle protégé.

### Commande `-sanction`

**Usage** : `-sanction @utilisateur`

**Description** : Affiche l'historique des sanctions (mutes, avertissements) d'un utilisateur.

**Fonctionnement** :
1. Mentionnez l'utilisateur dont vous souhaitez voir les sanctions après la commande.
2. Le bot affichera un embed avec les sanctions de l'utilisateur, 8 par page.
3. Utilisez les boutons de navigation pour parcourir les pages si l'utilisateur a plus de 8 sanctions.

## Dépannage

### Le bot ne se connecte pas
- Vérifiez que le token du bot est correct dans le fichier `.env`.
- Assurez-vous que les intents du bot sont activés dans le portail des développeurs Discord.

### Les commandes ne fonctionnent pas
- Vérifiez que le préfixe utilisé correspond à celui configuré dans le fichier `.env`.
- Assurez-vous que le bot a les permissions nécessaires sur le serveur.
- Vérifiez que le bot est bien connecté et en ligne.

### Les utilisateurs ne reçoivent pas de messages privés
- Certains utilisateurs peuvent avoir désactivé les messages privés provenant des membres du serveur.
- Le bot indiquera si un message privé n'a pas pu être envoyé.

### Le rôle Muted ne fonctionne pas correctement
- Assurez-vous que le rôle "Muted" est correctement configuré avec les permissions appropriées.
- Vérifiez que le rôle du bot est placé au-dessus du rôle "Muted" dans la hiérarchie des rôles.

## FAQ

### Comment ajouter des durées de mute personnalisées ?
Vous pouvez modifier le fichier `src/utils/roleManager.js` et ajouter des durées supplémentaires dans la méthode `getAvailableDurations`.

### Comment ajouter des raisons de mute personnalisées ?
Vous pouvez modifier le fichier `src/utils/roleManager.js` et ajouter des raisons supplémentaires dans la méthode `getCommonReasons`.

### Comment modifier le format des messages privés envoyés aux utilisateurs ?
Vous pouvez modifier les embeds dans les fichiers de commandes correspondants (`src/commands/moderation/tempmute.js`, `src/commands/moderation/warn.js`, etc.).

### Comment sauvegarder les données de sanctions ?
Les données sont automatiquement sauvegardées dans les fichiers `src/data/sanction.json` et `src/data/atcd.json`. Vous pouvez faire des sauvegardes régulières de ces fichiers si nécessaire.

