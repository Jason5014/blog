module.exports = {
    name: 'blog1',
    mongodb: 'mongodb://localhost:27017/blog1',
    secret: 'mean-blog-jason',
    salt: '13243543fdaskfjaoifjrit43543',
    pageSize: 10,
    host: 'localhost',
    port: 3000,
    mail: {
        host: 'smtp.163.com',
        secureConnection: true,
        port: 465,
        auth: {
            user: '15870608093@163.com',
            pass: 'jiesheng5014A'
        }
    },
    admin: {
        username: 'admin',
        password: '123456'
    }
};