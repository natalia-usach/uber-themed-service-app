const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const {secret} = require('../config');
const {userValidation} = require('../validations/user');

const generatePass = () => {
  let pass = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let passLength = (Math.random() * 15) + 5;
  
  for (let i = 0; i < passLength; i++)
    pass += possible.charAt(Math.floor(Math.random() * possible.length));

  return pass;
}

const generateAccessToken = (id, email, role) => {
  const payload = {
    id,
    email,
    role
  };
  return jwt.sign(payload, secret, {expiresIn: '24h'});
};

const handleServerError = (res, error) => {
  console.log(error);
  res.status(500).send({message: 'Server error'});
};

const registerUser = async (req, res) => {
  try {
      const {error} = userValidation(req.body);
      if(error) {
          return res.status(400).send({message: 'Invalid register data'});
      } else {
        const {email, password, role} = req.body;
        const candidate = await User.findOne({email: email});
        if(candidate) {
          return res.status(400).send({message: 'User with this email already exists'});
        }
        const hashPassword = bcrypt.hashSync(password, 7);
        const user = new User({email, password: hashPassword, role});
        await user
            .save()
            .then(() => res.status(200).send({message: 'Profile created successfully'}))
            .catch(() => res.status(400).send({message: error}));
      }

  } catch (error) {
    handleServerError(res, error);
  }
};

const loginUser = async (req, res) => {
  try {
    const {email, password} = req.body;
    const user = await User.findOne({email: email});
    if (!user) {
      return res.status(400).send({message: 'No user with such email'});
    }
    const validPassword = bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).send({message: 'Invalid password'});
    }
    const token = generateAccessToken(user._id, user.email, user.role);
    return res.status(200).send({jwt_token: token});
  } catch (error) {
    handleServerError(res, error);
  }
};

const recoverPassword = async (req, res) => {
  try {
    const user = await User.findOne({email: req.body.email});
    if (!user) {
      return res.status(400).send({message: 'No user with such email'});
    }

    let testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const newPassword = generatePass();

    const mailOptions = {
      from: testAccount.user,
      to: req.body.email,
      subject: 'Recovering your password',
      text: `Hello, your new password is ${newPassword}`
    };

    const hashPassword = bcrypt.hashSync(newPassword, 7);
    await User.findByIdAndUpdate(user._id, {password: hashPassword})
      .then(() => console.log('Password changed'))
      .catch((error) => handleServerError(res, error));

    transporter.sendMail(mailOptions, (error, info) => {
      if(error) {
        console.log(error);
        handleServerError(res, error);
      } else {
          console.log(nodemailer.getTestMessageUrl(info));
          return res.status(200).send({message: 'New password sent to your email address'});
        }
      })
  } catch (error) {
    handleServerError(res, error);
  }
};

module.exports = {
    registerUser,
    loginUser,
    recoverPassword
};
  