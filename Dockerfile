# Etapa de build
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa de execução: serve os arquivos estáticos do dist/
FROM node:22-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD serve -s dist -l ${PORT}
