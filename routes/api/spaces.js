// Dependencies
const express = require('express');
const { check, validationResult } = require('express-validator');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const dotenv = require('dotenv');
const auth = require('../../middleware/auth');
const uploadImageToCloudinary = require('../../controllers/spaces');

// Init enviormental variables
dotenv.config();

// config cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// init multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'upload/images/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// Init Express router
const router = express.Router();

// @route   POST api/v1/spaces/upload
// @desc    POST an image to spaces
// @access  PUBLIC
router.post(
  '/upload',
  auth,
  upload.single('image'),
  async (req, res) => {
    uploadImageToCloudinary(req, res);
  },
);

module.exports = router;
