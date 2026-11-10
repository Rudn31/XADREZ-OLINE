# Xadrez Online — imagem simples para o Render (o servidor não tem dependências)
FROM node:20-alpine
WORKDIR /app
COPY package.json server.js ./
COPY public ./public
ENV NODE_ENV=production
EXPOSE 10000
CMD ["node", "server.js"]
