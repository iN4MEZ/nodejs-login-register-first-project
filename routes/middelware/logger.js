// middleware
const logger = (req,res,next)=> {
    console.log(`A user connected IP ${req.ip}`);
    res.on('finish',() => {
        console.log(`REQ IP ${req.ip} INFO: ${req.method} ${res.statusCode}`);
    });
    next();
}

module.exports = logger;