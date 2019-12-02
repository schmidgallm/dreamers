const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

router.get(
	'/',
	[
		check('name', 'Name is required').not().isEmpty(),
		check('email', 'Please include valid email').isEmail(),
		check('password', 'password must be more than 6 characters').isLength({ min: 6 })
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}
		} catch (err) {
			console.warn(err);
			res.status(401).json({ msg: 'Not authorized' });
		}
	}
);

router.post('/', async (req, res) => {});

module.exports = router;
