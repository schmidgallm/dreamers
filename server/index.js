// dependencies
const express = require('express');
const logger = require('morgan');
const cors = require('cors');

// init app
const app = express();
const PORT = process.env.PORT || 5000;

// Use morgan to log all requests
app.use(logger('dev'));

// Body Parser Middleware
app.use(express.json({ extended: true }));

// cors middleware
app.use(cors());

// Init database connection
const connectDB = require('../db/index.js');
connectDB();

// init api routes
const userRoute = require('../routes/api/users');
app.use('/api/v1/users', userRoute);

// Init static assets if deployed
if (process.env.NODE_ENV === 'production') {
	// init static folder
	app.use(express.static(path.join(__dirname, 'client/build')));
}

// handle all other requests
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

// init server
app.listen(PORT, () => {
	console.log(`> Server now listening on port ${PORT}`);
});
