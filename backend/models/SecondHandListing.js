const mongoose = require('mongoose');

const SecondHandListingSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Very Good', 'Good', 'Fair'],
    required: true,
  },
  category: {
    type: String,
    default: 'Electronics',
  },
  seller: {
    type: String,
    default: 'Verified User',
  },
  sellerContact: {
    type: String,
    default: '',
  },
  images: [{ type: String }],
  image: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  negotiablePrice: {
    type: Boolean,
    default: true,
  },
  location: {
    type: String,
    default: 'Nairobi, Kenya',
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'pending',
  },
  listingStatus: {
    type: String,
    enum: ['available', 'sold', 'reserved'],
    default: 'available',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SecondHandListing', SecondHandListingSchema);
