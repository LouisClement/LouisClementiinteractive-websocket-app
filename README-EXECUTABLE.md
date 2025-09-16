# Guide d'utilisation des fichiers exécutables

## Fichiers créés

J'ai créé deux fichiers exécutables pour lancer votre application WebSocket interactive sur Mac :

### 1. `launch-app.sh` - Script principal
- Script bash complet avec gestion des erreurs
- Vérifie automatiquement les dépendances Node.js
- Installe les packages npm si nécessaire
- Lance le serveur et le client simultanément
- Gestion propre de l'arrêt avec Ctrl+C

### 2. `Lancer Application.command` - Fichier double-clic
- Fichier .command que vous pouvez double-cliquer dans le Finder
- Lance automatiquement le script principal
- Plus pratique pour les utilisateurs non-techniques

## Comment utiliser

### Option 1: Double-clic (Recommandé)
1. Ouvrez le Finder
2. Naviguez vers le dossier de votre projet
3. Double-cliquez sur `Lancer Application.command`
4. L'application se lancera automatiquement dans le Terminal

### Option 2: Terminal
```bash
cd /chemin/vers/votre/projet
./launch-app.sh
```

## Ce que fait le script

1. **Vérifications préalables** :
   - Vérifie que Node.js et npm sont installés
   - Affiche les versions installées

2. **Installation automatique** :
   - Installe les dépendances du client (si nécessaire)
   - Installe les dépendances du serveur (si nécessaire)

3. **Lancement** :
   - Démarre le serveur WebSocket sur le port 3001
   - Démarre le client web sur le port 5173
   - Ouvre automatiquement l'application dans votre navigateur

4. **URLs d'accès** :
   - Client web : http://localhost:5173
   - Serveur WebSocket : http://localhost:3001

## Arrêt de l'application

Appuyez sur `Ctrl+C` dans le terminal pour arrêter proprement l'application.

## Dépannage

Si vous rencontrez des problèmes :

1. **Node.js non installé** : Téléchargez depuis https://nodejs.org/
2. **Permissions** : Assurez-vous que les fichiers sont exécutables
3. **Ports occupés** : Vérifiez qu'aucune autre application n'utilise les ports 3001 et 5173

## Personnalisation

Vous pouvez modifier le script `launch-app.sh` pour :
- Changer les ports utilisés
- Ajouter des variables d'environnement
- Modifier les commandes de démarrage
