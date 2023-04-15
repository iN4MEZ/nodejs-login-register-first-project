const express = require('express');
const app = express();

const logger = require('./routes/middelware/logger');

const PORT = process.env.PORT || 5000;


// middleware init
app.use(logger);

// Static folder
app.use(express.static('public'))

// body parser
app.use(express.json());
app.use(express.urlencoded({ extends: false }));

// Send html file
app.get('/',(req,res) => {
    res.sendFile('../index.html')
});

// Routers
app.use('/',require('./routes/Auth/Authentications'));

app.listen(PORT,() => {console.log("listen on Port:" + PORT)});