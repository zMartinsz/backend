require('dotenv').config()
const express = require('express');
const routa_user = require('./routes/user');
const routa_arquivos = require('./routes/arquivos');
const ratelimit = require('express-rate-limit');
const auth = require('./middleware/auth');
const database = require('./config/db');
const app = express();
const port = process.env.port || 4000;
database.default();
app.use(express.json());
//#region  Limitador 
const limiter = ratelimit({
    windowsMS: 15 * 60 * 1000, // 15 Minutos
    max: 100 // limite por IP
})
app.use(limiter);
//#endregion

app.use('', routa_user);
app.use('arquivos', routa_arquivos);
app.listen(port, () => {
    console.log(`🚀 Server rodando na porta ${port}`)
})