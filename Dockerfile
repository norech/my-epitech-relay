FROM node:10.15.3-stretch

RUN apt-get update && apt-get install chromium -y

COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm install

RUN npm run build

ENV HOST="0.0.0.0"
ENV PORT="8080"
ENV NO_WINDOW="1"
ENV BROWSER_BINARY_PATH="/usr/bin/chromium"
ENV BROWSER_TYPE="chrome"
ENV BROWSER_ARGS="--no-sandbox"

EXPOSE 8080

CMD ["npm", "start"]
