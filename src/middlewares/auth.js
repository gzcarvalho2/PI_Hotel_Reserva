const jwt = require('jsonwebtoken');
require('dotenv').config();

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.send(401, { error: 'Token não fornecido' });
        return next(false); // No Restify, next(false) corta o fluxo imediatamente
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.send(401, { error: 'Token com formato inválido' });
        return next(false);
    }

    jwt.verify(parts[1], process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            res.send(401, { error: 'Token inválido ou expirado' });
            return next(false);
        }
        req.user = decoded;
        return next();
    });
}

module.exports = authMiddleware;