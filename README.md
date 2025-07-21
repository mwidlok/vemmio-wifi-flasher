# Vemmio Flasher

## Wymagania
* Node 20 LTS
* pnpm 9
* Wrangler ("npm i -g wrangler") – tylko dla backendu podczas dev/deploy.

## Instalacja

# 1) zależności
pnpm install

# 2) lokalne sekrety (nie trafiają do Git)
cp .dev.vars.example .dev.vars       # wypełnij klucze DO + hasła

# 3) dwa terminale
pnpm dev                             # frontend  http://localhost:5173
pnpm wrangler dev worker/index.ts    # API       http://localhost:8787


