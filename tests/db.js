const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongo;

/**
 * Connect to the in-memory database.
 */
module.exports.connect = async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  const mongooseOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  await mongoose.connect(uri, mongooseOpts);
};

/**
 * Drop database, close the connection and stop mongod.
 */
module.exports.closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
};

/**
 * clear single collection
 * @param {String} name - name of collection
 */
module.exports.clearCollection = async (name) => {
  const collections = mongoose.connection.collections;
  if (collections[name]) {
    await collections[name].deleteMany({});
  } else {
    console.error("Wrong collection name!");
  }
};

module.exports.clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};
