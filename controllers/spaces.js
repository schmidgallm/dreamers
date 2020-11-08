// Dependencies
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Models
const Spaces = require('../models/Spaces');
const User = require('../models/User');
const Profile = require('../models/Profile');

// Init enviorment variables
dotenv.config();

// Upload images to cloudnary and save instances to DB
const uploadImageToCloudinary = async (req, res) => {
  // config cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    // Find user and profile
    const user = await User.findById(req.user.id).select('-password');
    const profile = await Profile.findOne({ user: req.user.id });

    // if no profile
    if (!profile) {
      return res.status(400).json({
        msg: 'Must first create a profile before submitting stories',
      });
    }

    // store path to uploads folder in variable to use later
    const directory = path.join(__dirname, '../upload/images/');
    const file = req.file.originalname;

    const options = {
      folder: 'spaces',
      public_id: `${req.user.id}_${req.file.originalname}`,
      unique_filename: false,
    };

    cloudinary.uploader.upload(
      directory + file,
      options,
      (err, result) => {
        if (err) {
          return res.status(400).json({ msg: err });
        }

        if (result) {
          // init new instance of space inside db
          const newSpace = {};
          newSpace.user = req.user.id;
          newSpace.name = user.name;
          newSpace.penName = profile.penName;
          newSpace.title = req.body.title;
          newSpace.content = req.body.content;
          newSpace.assetId = result.asset_id;
          newSpace.publicId = result.public_id;
          newSpace.version = result.version;
          newSpace.versionId = result.version_id;
          newSpace.signature = result.signature;
          newSpace.width = result.width;
          newSpace.height = result.height;
          newSpace.format = result.format;
          newSpace.resourceType = result.resource_type;
          newSpace.bytes = result.tags;
          newSpace.type = result.type;
          newSpace.etag = result.etag;
          newSpace.placeholder = result.placeholder;
          newSpace.url = result.url;
          newSpace.secureUrl = result.secure_url;
          newSpace.accessMode = result.access_mode;
          newSpace.overwritten = result.overwritten;
          newSpace.orginalfileName = result.original_filename;
          newSpace.publicId = result.publicId;

          // unlink doc from upload/file folder
          fs.unlinkSync(req.file.path);

          // return response once all done
          return res.status(200).json(result);
        }
      },
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = uploadImageToCloudinary;
