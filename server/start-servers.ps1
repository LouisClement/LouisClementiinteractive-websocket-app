# Aller dans le répertoire du serveur
Set-Location -Path $PSScriptRoot

# Démarrer le serveur en arrière-plan
# Démarrer le serveur dans une nouvelle fenêtre pour voir les logs
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

# Attendre que le serveur démarre
Start-Sleep -Seconds 2

# Ouvrir la page web
Start-Process "http://127.0.0.1:3000/index-ws.html"
