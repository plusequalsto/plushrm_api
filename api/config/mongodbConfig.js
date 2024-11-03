const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const username = process.env.MONGO_USERNAME;
const password = encodeURIComponent(process.env.MONGO_PASSWORD);
const cluster = process.env.MONGO_CLUSTER;
const dbName = process.env.MONGO_DB_NAME;

const connectmongoDB = async () => {
  try {
    await mongoose.connect(`mongodb+srv://${username}:${password}@${cluster}/${dbName}`);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectmongoDB;
