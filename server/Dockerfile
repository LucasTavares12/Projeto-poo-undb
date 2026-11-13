# Etapa 1: compilar o TypeScript
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: imagem final, só com o necessário para rodar
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

# Porta que o server usa dentro do container
EXPOSE 3000

# Inicia o servidor
CMD ["npm", "start"]
