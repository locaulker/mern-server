const User = require('../models/user')
const jwt = require('jsonwebtoken')

// Sendgrid
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// exports.signup = (req, res) => {
//   const { name, email, password } = req.body

//   User.findOne({ email }).exec((err, user) => {
//     if (user) {
//       return res.status(400).json({
//         error: 'Sorry!, eMail already exists',
//       })
//     }
//   })

//   let newUser = new User({ name, email, password })

//   newUser.save((err, success) => {
//     if (err) {
//       console.log('SIGNUP ERROR', err)
//       return res.status(400).json({
//         error: err,
//       })
//     }
//     res.json({
//       message: 'Signup successful! Please sign in.',
//     })
//   })
// }

// --- SignUp Flow
exports.signup = (req, res) => {
  const { name, email, password } = req.body

  User.findOne({ email }).exec((err, user) => {
    if (user) {
      return res.status(400).json({
        error: 'Sorry!, eMail already exists',
      })
    }

    const token = jwt.sign(
      { name, email, password },
      process.env.JWT_ACCOUNT_ACTIVATION,
      { expiresIn: '10m' }
    )

    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Account Activation Link`,
      html: `
        <h2>Please use the following link to activate your account</h2>
        <p>${process.env.CLIENT_URL}/auth/activate/${token}</p>
        <hr />
        <p>This eMail contains sensitive information</p>
        <p>${process.env.CLIENT_URL}</p>
      `,
    }

    sgMail
      .send(emailData)
      .then(sent => {
        // console.log('SIGNUP EMAIL SENT', sent)
        return res.json({
          message: `eMail has been sent to ${email}. Please follow the instructions to activate your account`,
        })
      })
      .catch(err => {
        // console.log('SIGNUP EMAIL SENT ERROR', err)
        return res.json({
          message: err.message,
        })
      })
  })
}

exports.accountActivation = (req, res) => {
  const { token } = req.body

  if (token) {
    jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function (
      err,
      decoded
    ) {
      if (err) {
        console.log('JWT VERIFY ACCOUNT ACTIVATION ERROR', err)
        return res.status(401).json({
          error: 'Expired Link! Please Sign Up Again.',
        })
      }

      const { name, email, password } = jwt.decode(token)
      const user = new User({ name, email, password })
      user.save((err, user) => {
        if (err) {
          console.log('ACTIVATION ERROR - SAVE USER IN DATABASE', err)

          res.status(401).json({
            error: 'Error saving user in database. Try singing up again',
          })
        }
        return res.json({
          message: 'Signup Successful. Please sign in.',
        })
      })
    })
  } else {
    return res.json({
      message: 'Oops! Something wrong. Please try again.',
    })
  }
}

exports.signin = (req, res) => {
  const { email, password } = req.body

  //  check if user exists
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User with that email does not exist. Please Sign Up',
      })
    }

    // Authenticate if user exists
    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: 'Sorry! eMail or Password is not correct',
      })
    }

    // If user exists, generate a token and send to client-side
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    })
    const { _id, name, email, role } = user

    return res.json({
      token,
      user: { _id, name, email, role },
    })
  })
}
