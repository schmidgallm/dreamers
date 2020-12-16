// Dependencies
const fs = require('fs');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');

// Models
const Story = require('../models/Story');
const User = require('../models/User');
const Profile = require('../models/Profile');

// Init enviorment variables
dotenv.config();

// Upload to AWS S3 and save instances to DB
const uploadFileToS3 = async (req, res) => {
  // Init AWS s3 Interface
  AWS.config.setPromisesDependency();
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ID,
  });

  // Init new S3 object
  const s3 = new AWS.S3();

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

    // Check if file is PDF
    if (req.file.filename.split('.').pop() !== 'pdf') {
      return res.status(400).json({
        msg: 'File must be PDF',
      });
    }

    // Setting up S3 upload parameters
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Body: fs.createReadStream(req.file.path),
      Key: `${req.user.id}_${req.file.originalname}`, // File name you want to save as in S3
    };

    // init new story object to be stored in db
    const storyObj = {};
    storyObj.user = req.user.id;
    storyObj.title = req.body.title;
    storyObj.synopsis = req.body.synopsis;
    storyObj.genre = req.body.genre;
    storyObj.penName = profile.penName;
    storyObj.name = user.name;
    storyObj.mimetype = req.file.mimetype;

    // Uploading files to the bucket and add values to story obj
    const upload = await s3.upload(params).promise();
    storyObj.ETag = upload.ETag;
    storyObj.location = upload.Location;
    storyObj.key = upload.Key;

    // save story to db and update story id to profile
    const story = new Story(storyObj);
    await story.save();
    await profile.updateOne({ $push: { stories: story._id } });

    // remove file from temp upload folder
    fs.unlinkSync(req.file.path);

    // return response
    return res.status(200).json(story);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = uploadFileToS3;
