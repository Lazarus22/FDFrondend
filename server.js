import express from 'express';

const app = express();

// Custom HTTPS redirection middleware
const requireHTTPS = (req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
};

// Use the custom middleware to enforce HTTPS
app.use(requireHTTPS);

// Your other middleware and route definitions
app.get('/', (req, res) => {
  res.send('hello world');
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
