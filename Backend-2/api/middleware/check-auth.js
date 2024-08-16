const jwt = require("jsonwebtoken")

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY)
        req.userData = decoded;
        console.log(req.userData);
        
        if (req.headers["user-agent"] == req.userData["user-agent"]) {
            next();
        } else {
            return res.status(401).json({
                message: 'Token error'
            })    
        }
    } catch (error) {
        return res.status(401).json({
            message: 'Auth failed'
        })
    }
}