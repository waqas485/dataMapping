const sequelize  = require("./connection");
// Test the database connection
const connectDb = async () => {
    sequelize.authenticate()
        .then(() => {
            console.log('DB Connection has been established successfully.');
        })
        .catch(err => {
            console.error('Unable to connect to the database:', err);
        });
}

module.exports = connectDb;