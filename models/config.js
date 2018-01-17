module.exports = {
    port: 5000,
    dbUrl: 'localhost:27017',

    // secret for creating tokens
    token_secret: process.env.TOKEN_SECRET || 'reughdjsasdkpmasipkmsdfadf',
};
