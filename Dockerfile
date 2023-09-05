FROM node:18.16.0

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all other source files
COPY . .

# Build the Svelte app
RUN npm run build

# Expose the port the app will run on
EXPOSE 8080

# Command to run the application
CMD ["npm", "start"]