FROM node:14

RUN apt update && apt-get install -y apt-transport-https

RUN wget -q -O - https://mkvtoolnix.download/gpg-pub-moritzbunkus.txt | apt-key add -
RUN echo 'deb http://mkvtoolnix.download/debian/ stretch main' >>  /etc/apt/sources.list
RUN echo 'deb-src http://mkvtoolnix.download/debian/ stretch main' >>  /etc/apt/sources.list
RUN apt update && apt install -y mkvtoolnix

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

# ports and volumes
VOLUME /usr/src/app/config /movies
EXPOSE 3030

CMD [ "npm", "run", "start" ]