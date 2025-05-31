const mongoose = require('mongoose');

const IdCardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // owner of this card
  fullName: { type: String, required: true },
  designation: { type: String },
  department: { type: String },
  idNumber: { type: String, unique: true, required: true },
  issueDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  photo: { type: String }, // path to photo file or URL
}, { timestamps: true });

module.exports = mongoose.model('IdCard', IdCardSchema);
