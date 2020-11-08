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

    // Uploading files to the bucket
    s3.upload(params, (err, data) => {
      if (err) {
        return res.status(400).json({ msg: err });
      }

      if (data) {
        // init new instance of story
        console.log(data);
        const newStory = {};
        newStory.user = req.user.id;
        newStory.title = req.body.title;
        newStory.synopsis = req.body.synopsis;
        newStory.genre = req.body.genre;
        newStory.penName = profile.penName;
        newStory.name = user.name;
        newStory.mimetype = req.file.mimetype;
        newStory.ETag = data.ETag;
        newStory.location = data.Location;
        newStory.key = data.Key;

        // save story to db and push story.id to profile
        const story = new Story(newStory);
        story.save();
        profile.update({ $push: { stories: story.id } });

        // unlink doc from upload/file folder
        fs.unlinkSync(req.file.path);

        return res.status(200).json(story);
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = uploadFileToS3;
