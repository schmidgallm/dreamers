// Dependencies
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PromptSchema = new Schema({
	title: {
		type: String,
		required: true
	},
	content: {
		type: String,
		required: true
	},
	genre: {
		type: String,
		required: true
	},
	upvotes: {
		type: Number,
		default: 0
	},
	publishedDate: {
		type: Date,
		default: Date.now
	}
});

module.exports = Prompt = mongoose.model('prompts', PromptSchema);
