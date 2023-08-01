// const sequelize = require('./config/connection');
// const UserModel = require('./models/User');

// module.exports = resolvers = {
//   Query: {
//     getUserList: async (parent, args) => {
//       try {
//         await sequelize.authenticate();
//         const users = await UserModel.findAll();
//         console.log(users);
//         return users; // Removed unnecessary 'res.send'
//       } catch (error) {
//         console.error('Unable to get Users:', error);
//       }
//     },
    
//   },
//   Mutation: {
//     createUser: async (parent, args) => {
//       console.log(args);
//       console.log(parent);
//       try {
//         await sequelize.authenticate();
//         // await UserModel.sync({ force: true }); // Sync the model with the database
//         // console.log('User Model Synced');
//         const newUser = await UserModel.create({ firstName: "hamza", lastName: "iftikhar", age: 12 });
//         console.log("User Created", newUser.id);
//       } catch (error) {
//         console.error('Unable to Create User:', error);
//       }
//     }
//   }
// };