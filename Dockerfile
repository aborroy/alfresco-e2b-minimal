FROM node:22-alpine
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm i
COPY src ./src
COPY scripts ./scripts
CMD ["npm","run","start","--"]
