const { DataTypes } = require('sequelize');
const sequelize = require("../config/connection");

const UserModel = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER, // Corrected to INTEGER instead of NUMBER
    primaryKey: true,
    autoIncrement: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
  },
  age: {
    type: DataTypes.INTEGER, // Corrected to INTEGER instead of NUMBER
  },
}, {
  timestamps: true
});

sequelize.sync();
console.log("All models were synchronized successfully.");



module.exports = UserModel;
