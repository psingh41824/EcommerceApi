require('dotenv').config()
const express = require('express')
const app = express();
const mongoose = require('mongoose')
const http = require('http');
const PORT = process.env.PORT || 3000
const server = http.createServer(app);
const MONGO_URL = process.env.MONGO_URL


mongoose.connect(MONGO_URL)

.then(() => console.log('Connected to MongoDB'))
.catch(error => console.error('Connection failed', error))



server.listen(PORT,console.log("server is running"));