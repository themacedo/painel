#!/bin/zsh
# Abre o app desktop (compila antes). Uso: zsh ~/Documents/GitHub/painel/desktop/abrir.sh
set -e
cd "${0:A:h}"
export PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH"
[[ -d node_modules ]] || pnpm install --ignore-workspace
[[ -f node_modules/electron/path.txt ]] || node node_modules/electron/install.js
pnpm -s build >/dev/null
nohup ./node_modules/electron/dist/Electron.app/Contents/MacOS/Electron . >/dev/null 2>&1 &
