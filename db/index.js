const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');

const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI, {
			useNewUrlParser: true,
			useCreateIndex: true,
			useUnifiedTopology: true
		});
		console.log('> MongoDB connected...');
	} catch (err) {
		console.error(err.message);
	}
};

module.exports = connectDB;
