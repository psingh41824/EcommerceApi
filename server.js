require('dotenv').config()
const express = require('express')
const app = express();
const mongoose = require('mongoose')
const http = require('http');
const PORT = process.env.PORT || 5000
const server = http.createServer(app);
const MONGO_URL = process.env.MONGO_URL
const userRoute = require('./routes/userRoute')
const authRoute = require('./routes/authRoute')

app.set('view engine','ejs')
app.set('views','./views')

app.use('/api', userRoute)
app.use('/', authRoute)


mongoose.connect(MONGO_URL, {dbName: 'Ecommerce',  retryWrites: true, w: 'majority' })

.then(() => console.log('Connected to MongoDB'))
.catch(error => console.error('Connection failed', error))

server.listen(PORT,console.log("server is running"));