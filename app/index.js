// dependencies
const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const userRoute = require('../routes/api/users');
const authRoute = require('../routes/api/auth');
const profileRoute = require('../routes/api/profiles');
const storyRoute = require('../routes/api/stories');
const promptRoute = require('../routes/api/prompts');

// init app
const app = express();

// cors middleware
app.use(cors());

// Use morgan to log all requests
app.use(logger('dev'));

// Body Parser Middleware
app.use(express.json({ extended: true }));

// init api routes
app.use('/api/v1/users', userRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/profiles', profileRoute);
app.use('/api/v1/stories', storyRoute);
app.use('/api/v1/prompts', promptRoute);

// Export app to for server to use
module.exports = app;
