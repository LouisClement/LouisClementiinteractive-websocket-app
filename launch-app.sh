#!/bin/bash

# Script de lancement pour l'application WebSocket interactive
# Compatible macOS

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_message() {
    echo -e "${2}${1}${NC}"
}

# Fonction pour vérifier si une commande existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Fonction pour nettoyer les processus en arrière-plan
cleanup() {
    print_message "Arrêt de l'application..." "$YELLOW"
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
    fi
    exit 0
}

# Capturer Ctrl+C pour nettoyer proprement
trap cleanup SIGINT SIGTERM

# Obtenir le répertoire du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_message "🚀 Lancement de l'application WebSocket Interactive" "$BLUE"
print_message "📁 Répertoire: $SCRIPT_DIR" "$BLUE"

# Vérifier si Node.js est installé
if ! command_exists node; then
    print_message "❌ Erreur: Node.js n'est pas installé" "$RED"
    print_message "Veuillez installer Node.js depuis https://nodejs.org/" "$YELLOW"
    exit 1
fi

# Vérifier si npm est installé
if ! command_exists npm; then
    print_message "❌ Erreur: npm n'est pas installé" "$RED"
    exit 1
fi

print_message "✅ Node.js version: $(node --version)" "$GREEN"
print_message "✅ npm version: $(npm --version)" "$GREEN"

# Installer les dépendances du serveur si nécessaire
if [ ! -d "server/node_modules" ]; then
    print_message "📦 Installation des dépendances du serveur..." "$YELLOW"
    cd server
    npm install
    if [ $? -ne 0 ]; then
        print_message "❌ Erreur lors de l'installation des dépendances du serveur" "$RED"
        exit 1
    fi
    cd ..
fi

print_message "🔧 Démarrage du serveur WebSocket..." "$YELLOW"
# Démarrer le serveur en arrière-plan
cd server
npm start &
SERVER_PID=$!
cd ..

# Attendre que le serveur démarre
sleep 3

print_message "✅ Application démarrée avec succès!" "$GREEN"
print_message "🌐 Application web: http://localhost:3000" "$BLUE"
print_message "🌐 Version WebSocket: http://localhost:3000/index-ws.html" "$BLUE"
print_message "🔌 Serveur WebSocket: http://localhost:3000" "$BLUE"
print_message "" "$NC"
print_message "Appuyez sur Ctrl+C pour arrêter l'application" "$YELLOW"

# Attendre que l'utilisateur arrête l'application
wait
