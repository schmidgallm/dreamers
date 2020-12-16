// Dependencies
const mongoose = require('mongoose');

const SpacesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  name: {
    type: String,
  },
  penName: {
    type: String,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
  },
  assetId: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  version: {
    type: String,
    required: true,
  },
  versionId: {
    type: String,
    required: true,
  },
  signature: {
    type: String,
    required: true,
  },
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  format: {
    type: String,
    required: true,
  },
  resourceType: {
    type: String,
    required: true,
  },
  bytes: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  etag: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  secureUrl: {
    type: String,
    required: true,
  },
  accessMode: {
    type: String,
    required: true,
  },
  overwritten: {
    type: Boolean,
    default: false,
    required: true,
  },
  originalFilename: {
    type: String,
    required: true,
  },
  likes: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
    },
  ],
  publishedDate: {
    type: Date,
    default: Date.now,
  },
});

const Spaces = mongoose.model('spaces', SpacesSchema);

module.exports = Spaces;
