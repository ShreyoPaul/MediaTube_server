const jwt = require("jsonwebtoken");
const dotenv = require("dotenv")
dotenv.config()

const secret = process.env.JWT_SECRET_KEY;

function generateAccessToken(user) {
    const payload = {
        email: user.email,
        name: user.name
    };


    const options = { expiresIn: '7 days' };

    return jwt.sign(payload, secret, options)
}

function verifyAccessToken(token) {

    try {
        const decoded = jwt.verify(token, secret);
        return { success: true, data: decoded };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    const result = verifyAccessToken(token);

    if (!result.success) {
        return res.status(403).json({ error: result.error, status: 403 });
    }
    console.log(result.data)
    req.user = result.data;
    next();
}

module.exports = { generateAccessToken, authenticateToken };