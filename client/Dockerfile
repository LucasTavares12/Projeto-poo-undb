# Etapa 1: compilar o site (React + Vite gera a pasta dist)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Endereço da API, recebido do docker-compose e usado no build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Etapa 2: nginx entrega só os arquivos prontos do site
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Porta do nginx dentro do container
EXPOSE 80