# Use a smaller base image
FROM node:18.17.0-alpine

WORKDIR /app

# Copy only package files first to utilize caching
COPY package*.json ./

# Install project dependencies
RUN npm install -g npm@9.5.1 && \
    npm install && \
    npm cache clean --force && \
    rm -rf /tmp/*

# Install Chromium
RUN apk add --no-cache chromium

# Set the environment variable to avoid Chromium's sandbox
ENV CHROME_BIN=/usr/bin/chromium-browser

# Copy the entire Node.js app to the container
COPY . .

# Install PM2 globally
RUN npm install -g pm2@latest

# Expose port 3000 to the outside world
EXPOSE 3000

# Use PM2 to start the Node.js app
CMD ["pm2", "start", "index.js", "--no-daemon"]
