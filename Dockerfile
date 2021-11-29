FROM node:lts-alpine
WORKDIR /app 
RUN apk add --no-cache bash
COPY [ "package.json", "yarn.lock", "tsconfig.json", "./" ]
RUN yarn install
COPY . ./ 
CMD [ "yarn", "run", "serve"]
