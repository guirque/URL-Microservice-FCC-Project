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

//Requiring urlObj model and shortUrl model
const urlObjModel = require('./urlObjModel');
const shortUrlObjModel = require('./shortUrlObjModel');

//Connecting to DB on MongoDB Atlas
mongoose.connect('mongodb+srv://fccProjectGuique:enter@fccprojects.ugxakyf.mongodb.net/?retryWrites=true&w=majority', 
{ useNewUrlParser: true, useUnifiedTopology: true })
.then(() => { console.log('Connection to database established.'); checkShortURL(); })
.catch((error) => { console.log(`An error occurred connecting to the DB: ${error}`) });

//Checking if URL Tracker is necessary
async function checkShortURL()
{
  console.log(`Checking if shortUrl tracker exists.`);
  if(await shortUrlObjModel.count() <= 0) 
  {
    const newShortUrlTracker = new shortUrlObjModel({shorturl: 0});
    await newShortUrlTracker.save();
    console.log(`New object to track shortUrl number created.`);
  };
}

//Looking Up URL Wrapping Function
function lookup(res, url, hostname)
{
  return new Promise((resolve, reject) => 
  {
    dns.lookup(hostname, (error, address, family) => 
    {
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
      
      //INSERT DATA
      let shortUrlTracker = await shortUrlObjModel.findOne();
            
      let newLink = {
        original_url: url,
        short_url: shortUrlTracker.shorturl++
      };

      await shortUrlTracker.save();
        
      const dbObj = new urlObjModel(newLink); //Creating db object
      await dbObj.save();
      res.status(200).json(newLink);
    }
    else {errorMsg(res);}

  }
  catch(error)
  {
    console.log(`Error saving urlObj: ${error}`);
    errorMsg(res);
  }
}

//Redirect Function
async function redirect(req, res)
{
  try
  {
    //READ DATA
    const link = await urlObjModel.findOne({short_url: req.params.shorturl});

    if(link)
    {
      res.status(200).redirect(link.original_url);
    }
    else error404(res);
    
  }
  catch(error)
  {
    console.log(`There was an error while redirecting user.`);
    error404(res);
  }
}

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
  res.json(
    {
      error: 'invalid url'
    })
}
const error404 = (res) => {res.status(404).json({error: 'URL not found'});}

app.post('/api/shorturl', (req, res) =>
{
  const {url} = req.body;
  saveURL(res, url);
});

app.get('/api/shorturl/:shorturl', (req, res) =>
{
  redirect(req, res);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
