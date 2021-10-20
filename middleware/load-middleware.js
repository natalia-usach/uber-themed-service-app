const User = require('../models/User');

module.exports = async function(req, res, next) {
    if (req.method === 'OPTIONS') {
      next();
    }
  
    try {
        const user = await User.findOne({email: req.user.email});
        if(user.role === 'SHIPPER') {
            next();
        } else {
            return res.status(400).send({message: 'Available only for shippers'});
        }
    } catch (error) {
      console.log(error);
      return res.status(400).send({message: 'Client error'});
    }
  };