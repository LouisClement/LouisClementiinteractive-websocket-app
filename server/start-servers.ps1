# Aller dans le répertoire du serveur
Set-Location -Path $PSScriptRoot

# Démarrer le serveur en arrière-plan
# Start the server in the current window to see logs
 ts-node src/index.ts

# Attendre que le serveur démarre
Start-Sleep -Seconds 2

# Ouvrir la page web
Start-Process "http://127.0.0.1:3000"
