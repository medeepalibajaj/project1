FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY frontend/package.json ./frontend/package.json
RUN npm install --prefix frontend --no-audit --no-fund

COPY . .

RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]
