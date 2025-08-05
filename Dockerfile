###
# Multi-stage Dockerfile to build and serve the Vemmio Flasher app with Nginx
###
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies and build the frontend
COPY package*.json yarn.lock* ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

###
# Nginx stage: serve built assets
###
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Remove default config and add our own
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/vemmio-flasher.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
