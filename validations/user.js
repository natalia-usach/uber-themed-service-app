const Joi = require('joi');

exports.userValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(4).max(255).required().email(),
        password: Joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
        role: Joi.string().required().valid('SHIPPER', 'DRIVER')
    });

    return schema.validate(data);
}