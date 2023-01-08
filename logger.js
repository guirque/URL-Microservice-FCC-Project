function logger(req, res, next)
{   
    console.log(`
    Request Made ---
    Method: ${req.method}
    Page  : ${req.url}`);

    next();
}

module.exports = logger;