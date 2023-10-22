const express = require('express');
const http = require('http');
const enforce = require('express-sslify');
const path = require('path');

const app = express();

// Use enforce.HTTPS() middleware to enforce HTTPS connections
app.use(enforce.HTTPS());

// Serve static files (your Svelte app) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle other server-side routes and logic as needed

// Create an HTTP server and listen on a port
const port = process.env.PORT || 3000;
http.createServer(app).listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
