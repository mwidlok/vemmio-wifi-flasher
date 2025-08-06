# Vemmio Flasher

## Wymagania
* Node 20 LTS
* pnpm 9
* doctl CLI (optional, for deploying DigitalOcean Functions)

## Instalacja

# 1) zależności
pnpm install

# 2) lokalne sekrety (nie trafiają do Git)
cp .dev.vars.example .dev.vars       # wypełnij klucze DO + hasła

# 3) dwa terminale
pnpm dev                             # frontend  http://localhost:5173

pnpm api                             # API       http://localhost:8787

## Docker Deployment

Build and run the Vemmio Flasher UI as a static Nginx container:

```bash
# Build the Docker image from the project root:
docker build -t vemmio-flasher:latest .

# Run the container, exposing port 80 (mapped to host port 8080):
docker run --rm -p 8080:80 vemmio-flasher:latest

# Then open http://localhost:8080 in your browser.
```

Alternatively, use Docker Compose for a one‑step build & run:

```bash
docker-compose up --build
```

## DigitalOcean Functions Deployment

You can deploy the same API logic to DigitalOcean Functions using the `do-worker` folder or the npm script:

```bash
# Install and authenticate doctl: https://docs.digitalocean.com/reference/doctl/
pnpm deploy:do
```
