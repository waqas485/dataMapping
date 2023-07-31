const Sequelize = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(process.env.DATABASE_NAME, process.env.USER, process.env.PASSWORD, {
    host: process.env.HOST,
    dialect: 'mssql',
    port: 1433,
    logging: false,
});
module.exports = sequelize;
