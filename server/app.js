const express = require('express');
const cors = require('cors');
const multer = require('multer');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log file upload progress
app.use((req, res, next) => {
    if (req.method === 'POST' && req.url === '/api/extract-text') {
        let uploadedBytes = 0;
        req.on('data', (chunk) => {
            uploadedBytes += chunk.length;
            console.log(`Uploaded ${uploadedBytes} bytes...`);
        });
    }
    next();
});

app.use('/', routes);

module.exports = app;