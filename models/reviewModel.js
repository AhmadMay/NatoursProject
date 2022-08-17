let mongoose = require('mongoose');
const Tour = require('./tourModels');
// const User = require('../models/userModels');

let mySchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

mySchema.statics.calcAverageratings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        averageRatings: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);
  if (stats > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].averageRatings,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

mySchema.post('save', function () {
  this.constructor.calcAverageratings(this.tour);
});

mySchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

mySchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  // console.log(this.r); 
  next();
});

mySchema.post(/^findOneAnd/, async function () {
  //await this.finOne(),does not work here, query has already executed
  await this.r.constructor.calcAverageratings(this.r.tour);
});

const Review = new mongoose.model('Review', mySchema);

module.exports = Review;
