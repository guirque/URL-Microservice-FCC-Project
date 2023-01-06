require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

//Logger Middleware
const logger = require('./logger');
app.use(logger);

//Short URL Data
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

  //Is there already a short url for that original one?
  const UrlStored = urls.find((anUrl) => anUrl.original_url == url);
  if(UrlStored) return res.status(200).json(UrlStored);
  
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

    dns.lookup(hostname, (error, address, family) => 
      {
        if(error)
        {
          errorMsg(res);
        }
        else
        {
          let newLink = {
            original_url: url,
            short_url: shortUrl++
          };
      
          urls.push(newLink);
      
          res.status(200).json(newLink);
        }
    })
  }
  else errorMsg(res);

});

app.get('/api/shorturl/:shorturl', (req, res) =>
{
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
