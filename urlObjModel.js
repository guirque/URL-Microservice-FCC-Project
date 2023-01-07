const mongoose = require('mongoose');

//Creating Schema
const urlObjSchema = new mongoose.Schema( 
{
    original_url: String,
    short_url: Number
});

//Exporting Schema
module.exports = mongoose.model('urlObjs', urlObjSchema);