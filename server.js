const express = require('express');
const http = require('http');
const enforce = require('express-sslify');
const path = require('path');

const app = express();

// Use enforce.HTTPS() middleware with trustProtoHeader option for Heroku
app.use(enforce.HTTPS({ trustProtoHeader: true }));

// Serve static files (your Svelte app) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Define your routes and other middleware as needed
app.get('/', (_, res) => {
    res.send('Hello, Express-SSLify and Svelte!');
});

// Create an HTTP server and listen on a port
const port = process.env.PORT || 3000;
http.createServer(app).listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
