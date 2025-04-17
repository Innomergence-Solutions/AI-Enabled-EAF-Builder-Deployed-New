# Use Node.js base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json from the context (./backend)
COPY ./package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the source code into the container
COPY ./src/api-server ./

# Expose the backend port
EXPOSE 3001

# Command to run the app
CMD ["npm", "start"]
