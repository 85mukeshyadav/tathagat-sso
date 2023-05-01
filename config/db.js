require('dotenv').config();
const Sequelize = require('sequelize');

console.log('ENV detail', process.env.DB);
const Db = process.env.DB;
const sequelize = new Sequelize(
    Db,
    process.env.DB_USER,
    process.env.DB_PWD,
    {
        host: 'prepcha.com',
        dialect: 'mariadb',
        pool: {
            max: 5000,
            min: 0,
            acquire: 300000,
            idle: 10000,
        },
        define: {
            timestamps: false,
        },
    }
);

const users = require('../models/users.js')(sequelize, Sequelize);


sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err);
    });

module.exports = {

    users,

};
