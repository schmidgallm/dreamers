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

    const upload = await cloudinary.uploader.upload(
      directory + file,
      options,
    );

    // init new instance of space object
    const newSpace = {};
    newSpace.user = req.user.id;
    newSpace.name = user.name;
    newSpace.penName = profile.penName;
    newSpace.title = req.body.title;
    newSpace.content = req.body.content;
    newSpace.assetId = upload.asset_id;
    newSpace.publicId = upload.public_id;
    newSpace.version = upload.version;
    newSpace.versionId = upload.version_id;
    newSpace.signature = upload.signature;
    newSpace.width = upload.width;
    newSpace.height = upload.height;
    newSpace.format = upload.format;
    newSpace.resourceType = upload.resource_type;
    newSpace.bytes = upload.bytes;
    newSpace.type = upload.type;
    newSpace.etag = upload.etag;
    newSpace.placeholder = upload.placeholder;
    newSpace.url = upload.url;
    newSpace.secureUrl = upload.secure_url;
    newSpace.accessMode = upload.access_mode;
    newSpace.overwritten = upload.overwritten;
    newSpace.originalFilename = upload.original_filename;

    // save space to db and push space.id to profile
    const space = new Spaces(newSpace);
    await space.save();
    await profile.update({ $push: { spaces: space.id } });

    // unlink doc from upload/file folder
    fs.unlinkSync(req.file.path);

    // return response with space object
    return res.status(200).json(space);

    // return response once all done
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = uploadImageToCloudinary;
