import sslRedirect from 'heroku-ssl-redirect';
import express from 'express';

const app = express();

// Enable SSL redirect
app.use(sslRedirect());

// Your other middleware and route definitions
app.get('/', (req, res) => {
  res.send('hello world');
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});