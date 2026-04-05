require('dotenv').config();
const express = require('express');
const path    = require('path');
const app     = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/',      (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.listen(process.env.PORT || 3000, () => console.log('🎬 EditKori running'));
