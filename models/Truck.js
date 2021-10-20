const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const truckSchema = new Schema({
  created_by: {
    type: String,
    required: true
  },
  assigned_to: {
    type: String
  },
  type: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'IS'
  },
  created_date: {
    type: Date,
    default: new Date().toISOString()
  }
}, {versionKey: false});

const Truck = mongoose.model('Truck', truckSchema);

module.exports = Truck;
