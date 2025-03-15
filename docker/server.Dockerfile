FROM node:14

WORKDIR /app

# Copy package.json (No need for package-lock.json as it will be generated)
COPY server/package.json ./

# Install dependencies and generate package-lock.json
RUN npm install

# Copy the rest of the server application
COPY server/ ./

# Expose the port your server runs on
EXPOSE 3000

# Command to run the server
CMD ["npm", "start"]