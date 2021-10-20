const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const loadSchema = new Schema({
  created_by: {
    type: String
  },
  assigned_to: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'NEW'
  },
  state: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    required: true
  },
  payload: {
    type: Number,
    required: true
  },
  pickup_address: {
    type: String,
    required: true
  },
  delivery_address: {
    type: String,
    required: true
  },
  dimensions: {
        width: {
            type: Number,
            required: true
        },
        length: {
            type: Number,
            required: true
        },
        height: {
            type: Number,
            required: true
        }
  },
  logs: [
    {
        message: {
            type: String,
            default: ''
        },
        time: {
            type: Date,
            default: ''
        },
        _id: false
    }
  ],
  created_date: {
    type: Date,
    default: new Date().toISOString()
  }
}, {versionKey: false});

const Load = mongoose.model('Load', loadSchema);

module.exports = Load;
