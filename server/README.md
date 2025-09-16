# Mutabilis - Application Interactive WebSocket

Cette application fournit une interface web interactive permettant à des utilisateurs de contrôler une installation (par exemple, via Châtaigne) en utilisant des boutons sur leur smartphone ou ordinateur. Le système gère une salle d'attente et un roulement pour les utilisateurs actifs.

## Fonctionnalités

*   **Serveur WebSocket** : Construit avec Node.js, Express et la bibliothèque `ws`.
*   **Interface Client** : Une page web responsive (`HTML`/`CSS`/`JS`) qui se connecte au serveur.
*   **Système de Salle d'Attente** : Gère un nombre limité d'utilisateurs actifs et place les autres en file d'attente.
*   **Rotation des Utilisateurs** : Fait tourner les utilisateurs entre la file d'attente et la session active à intervalle régulier.
*   **Utilisateur Prioritaire** : Permet à un administrateur de se connecter et de devenir actif immédiatement.
*   **Communication avec Châtaigne** : Un second serveur WebSocket sur le port `8080` est dédié à la communication avec le logiciel Châtaigne.

## Prérequis

*   [**Node.js**](https://nodejs.org/) (version 16 ou supérieure recommandée). `npm` est inclus avec Node.js.
*   [**Git**](https://git-scm.com/) pour cloner le projet.

## Installation

1.  **Clonez le dépôt GitHub** :
    ```bash
    git clone https://github.com/LouisClement/LouisClementiinteractive-websocket-app.git
    ```

2.  **Naviguez dans le dossier du serveur** :
    ```bash
    cd LouisClementiinteractive-websocket-app/server
    ```

3.  **Installez les dépendances** :
    Cette commande télécharge toutes les bibliothèques nécessaires au projet.
    ```bash
    npm install
    ```

## Lancement de l'application

### Sur Windows

Double-cliquez sur le fichier `Lancer-Mutabilis.bat` à la racine du projet. Il lancera le serveur et ouvrira automatiquement la page de l'application dans votre navigateur.

### Sur macOS ou manuellement

1.  Ouvrez un terminal dans le dossier `server`.
2.  Lancez le serveur avec la commande :
    ```bash
    npm start
    ```
Le serveur démarre en utilisant `ts-node`, qui compile et exécute le code TypeScript à la volée. Aucune étape de `build` n'est nécessaire pour le développement.

Le terminal affichera un message de confirmation : `Server running on http://0.0.0.0:3000`.

## Accès à l'application

*   **Utilisateurs** : Ouvrez un navigateur et allez à l'adresse `http://<ADRESSE_IP_DU_SERVEUR>:3000`.
*   **Administrateur (Utilisateur Prioritaire)** : Pour un accès prioritaire qui contourne la file d'attente, utilisez l'URL : `http://<ADRESSE_IP_DU_SERVEUR>:3000?admin=true`.

## Architecture et Ports

*   **Serveur Web Principal** : Port `3000`. Sert l'interface client et gère les connexions des utilisateurs.
*   **Serveur pour Châtaigne** : Port `8080`. Un serveur WebSocket distinct écoute sur ce port pour recevoir des connexions exclusives de Châtaigne.
