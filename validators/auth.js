const { check } = require('express-validator')

exports.userSignupValidator = [
  check('name').not().isEmpty().withMessage('Name is required'),
  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  check('email').isEmail().withMessage('Must be a valid eMail Address'),
]

exports.userSigninValidator = [
  check('email').isEmail().withMessage('Must be a valid eMail Address'),
  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
]
