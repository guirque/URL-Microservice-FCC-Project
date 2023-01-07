const express = require('express');
const app = express();

app.use(express.urlencoded({extended: false}));
app.use(express.json());

function logger(req, res, next)
{   
    console.log(`
    Request Made ---
    Method: ${req.method}
    Page  : ${req.url}`);

    next();
}

module.exports = logger;