const { MongoClient, ServerApiVersion } = require("mongodb");
   // uri = `mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000`;
    uri = `mongodb+srv://waqasali485:admin@cluster0.np1dlwb.mongodb.net/`;
    console.info("-=-=-=-");
    let mongoClient = new MongoClient(uri, { useNewUrlParser: true ,useUnifiedTopology: true});
    let DB = mongoClient.db('graphqlDB');
    module.exports = DB;
