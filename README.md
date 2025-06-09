# Bot Discord de Modération

Un bot Discord complet avec des fonctionnalités de modération avancées incluant tempmute, unmute, warn, sanction et unmuteall avec système de rôles hiérarchiques et stockage des données.

## Fonctionnalités

### Commande `-tempmute`
- Permet de mute temporairement un utilisateur
- Vérifie que l'utilisateur ciblé n'a pas un rôle supérieur ou égal au muteur
- Pas de mute possible sur un utilisateur avec un rôle protégé
- La raison du mute doit faire 25 caractères maximum
- Menu déroulant pour choisir la raison et la durée
- Les durées disponibles changent si l'utilisateur cible a certains rôles spéciaux (ajout d'un 24h)
- Ajoute automatiquement le rôle Muted
- Retire tous les autres rôles pendant le mute
- Planifie automatiquement un unmute après la durée choisie
- Restaure les anciens rôles de l'utilisateur après le unmute
- Envoie un message privé à l'utilisateur mute
- Log chaque mute dans un fichier sanction.json
- Interaction expirée si pas de réponse après 2 minutes

### Commande `-unmute`
- Permet de retirer le mute d'un utilisateur
- Restaure les anciens rôles de l'utilisateur

### Commande `-unmuteall`
- Permet de retirer le mute de tous les utilisateurs mute

### Commande `-warn`
- Permet d'avertir un utilisateur
- Envoie un message privé au membre avec l'avertissement
- Enregistre l'avertissement dans atcd.json

### Commande `-sanction`
- Permet de voir les sanctions (warn, mute, etc.) d'un utilisateur
- Affiche une liste avec un système de pagination (8 sanctions max par page)

## Installation

1. Clonez ce dépôt :
```bash
git clone https://github.com/votre-nom/discord-moderation-bot.git
cd discord-moderation-bot-js
```

2. Installez les dépendances :
```bash
npm install
```

3. Créez un fichier `.env` à partir du fichier `.env.example` :
```bash
cp .env.example .env
```

4. Modifiez le fichier `.env` avec vos propres informations :
```
BOT_TOKEN=votre_token_bot_ici
GUILD_ID=id_de_votre_serveur
MUTED_ROLE_ID=id_du_role_muted
MODERATION_CHANNEL_ID=id_du_salon_moderation
PROTECTED_ROLES=123456789,987654321
SPECIAL_ROLES=123456789,987654321
COMMAND_PREFIX=-
```

5. Démarrez le bot :
```bash
npm start
```

## Structure du projet

```
discord-moderation-bot-js/
├── index.js                  # Point d'entrée du bot
├── package.json              # Configuration du projet
├── .env.example              # Exemple de configuration
├── src/
│   ├── commands/             # Commandes du bot
│   │   ├── moderation/       # Commandes de modération
│   │   │   ├── tempmute.js
│   │   │   ├── unmute.js
│   │   │   ├── unmuteall.js
│   │   │   ├── warn.js
│   │   │   └── sanction.js
│   │   └── utility/          # Commandes utilitaires
│   ├── events/               # Gestionnaires d'événements
│   │   ├── messageCreate.js
│   │   └── ready.js
│   ├── utils/                # Utilitaires
│   │   ├── roleManager.js
│   │   └── sanctionManager.js
│   └── data/                 # Données
│       ├── sanction.json
│       └── atcd.json
└── README.md                 # Documentation
```

## Licence

Ce projet est sous licence ISC.

