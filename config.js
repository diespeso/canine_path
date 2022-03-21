module.exports = {
    port: process.env.PORT || 3000,
    urlParser: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
    db_con: {
            host: 'localhost',
            user: 'root',
            multipleStatements: true
    }
}