const connectDb = require("./config/db");
const express = require('express');
const cors = require('cors')
const expressBusboy = require('express-busboy');
const app = express();
const userResolver = require('./resolvers')
const userTypeDef = require('./typeDefs')
const { ApolloServer } = require('apollo-server');
const router = require('./routes/routes')
require('dotenv').config();

connectDb();
app.use(cors({
    origin: '*'
}));
app.use(express.json());
expressBusboy.extend(app, {
    upload: true,
    path: "/temp",
    allowedPath: /./,
});
app.use('/', router);
app.listen(3000, function () {
    console.log("info", 'Server is running at port : ' + 3000);
});
const server = new ApolloServer({
    typeDefs: userTypeDef,
    resolvers: userResolver
});


server.listen(process.env.PORT, () => console.log(`🛸 Server is running on the port ${process.env.PORT || 8001}`))
