const mongoose = require('mongoose');

const shorturl = new mongoose.Schema(
    {
        shorturl: Number
    });

module.exports = mongoose.model('shortUrl', shorturl);