const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
    });
    console.log('> MongoDB connected...');
  } catch (err) {
    console.error(err.message);
  }
};

module.exports = connectDB;
