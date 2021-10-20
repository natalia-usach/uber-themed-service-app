const User = require('../models/User');
const Truck = require('../models/Truck');
const bcrypt = require('bcrypt');
  
  const handleServerError = (res, error) => {
    console.log(error);
    res.status(500).send({message: 'Server error'});
  };

  const getUserInfo = async (req, res) => {
    try {
      const user = await User.findOne({email: req.user.email});
      if(!user) {
          return res.status(400).send({message: 'No user with this email was found'});
      }
      const {_id, role, email, created_date} = user;
      return res.status(200).send({
        user: {
          _id,
          role,
          email,
          created_date
        }
      });
    } catch (error) {
      console.log(error);
      handleServerError(res, error);
    }
  };
  
  const deleteUser = async (req, res) => {
    try {
        const user = await User.findOne({email: req.user.email});
        if(user.role === 'DRIVER') {
            const truck = Truck.findOne({assigned_to: req.user.id, status: 'OL'});
            if(!truck) {
                return res.status(400).send({message: 'You cannot delete your account when you are on a load'});
            }
            await User.findByIdAndDelete(req.user.id)
            .then(() => {
                req.user = '';
                res.status(200).send({message: 'Profile deleted successfully'});
            })
            .catch(() => res.status(400).send({message: 'Client error'}));
        } else {
            await User.findByIdAndDelete(req.user.id)
            .then(() => {
                req.user = '';
                res.status(200).send({message: 'Profile deleted successfully'});
            })
            .catch(() => res.status(400).send({message: 'Client error'}));
        }
    } catch (error) {
      console.log(error);
      handleServerError(res, error);
    }
  };
  
  const changePassword = async (req, res) => {
    try {
        const passwords = req.body;
        const user = await User.findOne({_id: req.user.id});
        const validOldPassword = bcrypt.compare(passwords.oldPassword, user.password);
        if(!validOldPassword) {
            return res.status(400).send({message: 'Invalid old password'});
        }
        const hashPassword = bcrypt.hashSync(req.body.newPassword, 7);
        await User.findByIdAndUpdate(req.user.id, {password: hashPassword})
            .then(() => {
                res.status(200).send({message: 'Password changed successfully'});
            })
            .catch(() => res.status(400).send({message: 'Client error'}));
    } catch (error) {
        console.log(error);
        handleServerError(res, error);
    }
  };
  
  module.exports = {
    getUserInfo,
    deleteUser,
    changePassword
  };
  