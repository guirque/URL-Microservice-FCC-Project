function logger(req, res, next)
{
    let urlInRequest;
    if(req.hasOwnProperty('body') && req.body.hasOwnProperty('url')) urlInRequest = req.body.url;
    else urlInRequest = 'none';
    
    console.log(`
    Request Made ---
    Method: ${req.method}
    URL  : ${urlInRequest}`);

    next();
}

module.exports = logger;