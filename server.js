require('dotenv').config()
const express = require('express');
const routes = require('./routes/user');
const ratelimit = require('express-rate-limit');
const database = require('./config/db')
const app = express();
const port = process.env.port || 4000;
database.default()
app.use(express.json());
//#region  Limitador 
const limiter = ratelimit({
    windowsMS: 15 * 60 * 1000, // 15 Minutos
    max: 100 // limite por IP
})
app.use(limiter);
//#endregion

app.use('', routes);
app.listen(port, () => {
    console.log(`🚀 Server rodando na porta ${port}`)
})