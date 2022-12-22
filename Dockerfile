FROM node:12-stretch
WORKDIR /app/my-epitech-relay
RUN apt-get update && apt-get install chromium -y
COPY . /app/my-epitech-relay
RUN npm install
RUN npm run build
EXPOSE $PORT
CMD ["npm", "start"]
