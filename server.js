const express = require('express');
const app = express();

function ensureHttps(req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
}

app.use(ensureHttps);

app.use(express.static('public'));

app.get('*', (req, res) => {
    res.sendFile(`${__dirname}/public/index.html`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
