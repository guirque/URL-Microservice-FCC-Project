require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

//Logger Middleware
const logger = require('./logger');
app.use(logger);

//Short URL Data
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1/urls', () => {console.log('Connection to database established.')});

//Requiring urlObj model
const urlObjModel = require('./urlObjModel');

//Looking Up URL Wrapping Function
function lookup(res, url, hostname)
{
  return new Promise((resolve, reject) => 
  {
    dns.lookup(hostname, (error, address, family) => 
    {
      console.log('Looking up');
      if(error) {reject();}
      else resolve(true);
  });
  })
}

//Save Data Function
async function saveURL(res, url)
{
  try{

    //Is there already a short url for that original one?
    //const UrlStored = urls.find((anUrl) => anUrl.original_url == url);
    const UrlStored = await urlObjModel.count({original_url: url});
    if(UrlStored > 0) 
    {
      return res.status(200).json(await urlObjModel.findOne({original_url: url}, {_id: 0, __v: 0}));
    }

    //If url given contains http:// or https://
    if((url.search(/http[s]*:\/\//ig)) != -1)
    {
      //Getting host name
      let hostname = url.match(/[^\/]+/ig)
          .find((section) => {
              if(section.search('http') == -1) 
              return true; 
              else return false;}
              );
      //Checking if hostname exists
      await lookup(res, url, hostname);
      
      //NOTE FOR LATER: CHECK IF BOOL ANALYSIS IS NECESSARY (maybe just await alone will do, since, in case of errors, lookup will trigger the try/catch)
      //INSERT DATA
      let newLink = {
        original_url: url,
        short_url: shortUrl++
      };
        
      const dbObj = new urlObjModel(newLink); //Creating db object
      await dbObj.save();
      res.status(200).json(newLink);
    }
    else {errorMsg(res);}

  }
  catch(error)
  {
    console.log(`Error saving urlObj`);
    errorMsg(res);
  }
}

let shortUrl = 0;
let urls = [];

//DNS
const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

//Inserting New URLs
app.use(express.urlencoded({extended: false}));
app.use(express.json());
const errorMsg = (res) => 
{
  res.status(400).json(
    {
      error: 'invalid url'
    })
}
app.post('/api/shorturl', (req, res) =>
{
  const {url} = req.body;
  saveURL(res, url);

});

app.get('/api/shorturl/:shorturl', (req, res) =>
{

  //READ DATA
  const link = urls.find((urlObj) => 
  {
    if(req.params.shorturl == urlObj.short_url) return true;
    else return false;
  });

  if(link)
  {
    res.status(200).redirect(link.original_url);
  }
  else
  {
    res.status(404).json(
      {
        error: 'URL not found'
      });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
