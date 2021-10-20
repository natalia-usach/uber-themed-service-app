const Joi = require('joi');

exports.truckValidation = (data) => {
    const schema = Joi.object({
        type: Joi.string().required().valid('SPRINTER', 'SMALL STRAIGHT', 'LARGE STRAIGHT'),
        status: Joi.string().valid('IS', 'OL')
    });

    return schema.validate(data);
}