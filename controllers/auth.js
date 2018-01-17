const User = require('../models/schemas/user');
const jwt = require('jwt-simple');
const config = require('../models/config');

exports.loginUser = (req, res, next) => {
    if (typeof req.body.email !== 'string')
        return res.status(400).send('Missing email');
    if (typeof req.body.password !== 'string')
        return res.status(400).send('Missing password');

    User.findOne({email: req.body.email}, (err, user) => {
        if (err) return next(err);
        if (!user) return res.status(400).send('No user with that email');
        user.comparePassword(req.body.password, (err, isMatch) => {
            if (err) return next(err);
            if (!isMatch)
                return res.status(401).send('Incorrect password');

            // add relevant data to token
            let payload = {
                id: user._id,
                email: user.email
            };

            let token = jwt.encode(payload, config.token_secret);
            user.token = token;
            user.save((err) => {
                if (err) return next(err);
                res.json({ token, userId: user._id });
            });
        });
    });
};

exports.validateUser = (req, res, next) => {
    validateToken(req, res, next, {});
};

function validateToken(req, res, next, c) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (!token) return res.status(403).send('User not logged in');

    try {
        var decoded = jwt.decode(token, config.token_secret);
    } catch(err) {
        return res.status(403).send('Failed to authenticate token');
    }

    if (!decoded.id) return res.status(403).send('Invalid token');

    User.findById(decoded.id, (err, user) => {
        if (err) return next(err);
        if (!user) return res.status(403).send('Invalid user ID');
        if (token !== user.token) return res.status(403).send('Expired token');
        req.user = user;
        req.id = decoded.id;
        next();
    });
}
