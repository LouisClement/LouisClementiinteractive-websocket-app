#!/bin/bash

# Script de lancement pour l'application WebSocket interactive
# Fichier .command pour double-clic sur macOS

# Obtenir le répertoire du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Exécuter le script principal
./launch-app.sh
