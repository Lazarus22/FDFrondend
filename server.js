import express from 'express';
import path from 'path';

const app = express();  // Initialize the express app

// Enforce HTTPS
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  return next();
});

// Serve static files
app.use(express.static(path.join(process.cwd(), 'public')));

// Catch-all to serve index.html
app.get('*', (_, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
