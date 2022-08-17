const { match } = require('assert');
let fs = require('fs');
let mongoose = require('mongoose');
const { stringify } = require('querystring');
let Tour = require('../models/tourModels');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

let tours = JSON.parse(
  fs.readFileSync('./dev-data/data/tours-simple.json', 'utf-8')
);

// exports.checkId = (req, res, next, val) => {
//   console.log(`tour id is:${val} `);
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid Id',
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || req.body.price)
//     return res.status(400).json({
//       status: 'fail',
//       message: 'this tour is not defind',
//     });
//   next();
// };


//?rout handlers
// exports.getAlltours = catchAsync(async (req, res,next) => {
//   //?execute query
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   let tours = await features.query;

//   res.status(200).json({
  //     status: 'success',
//     time: req.requestTime,
//     results: tours.length,
//     data: {
  //       tours,
  //     },
//   });
// });
// exports.getTour = async (req, res) => {
  //   try {
    //     // const Tour=new tour.findById(req.params.id)
    //     // const tour = tours.find((el) => el.id === id);
    //     // const id = req.params.id * 1;
    //     const tours = await Tour.findById(req.params.id).populate('reviews');
    //     res.status(200).json({
      //       status: 'success',
      //       data: {
        //         tours,
        //       },
        //     });
        //   } catch (error) {
          //     return res.status(400).send(error);
          //   }
          // };
          // exports.createNewTour = async (req, res) => {
            //   //handling post requests
            //   //   console.log(req.body);
            
            //   // let tourData = {
              //   //   name: 'Tour 2 for testing',
//   //   price: 48000,
//   //   rating: 4.5,
//   // };
//   try {
//     let tours = await Tour.create(req.body);
//     console.log(tours);

//     res.status(201).json({
//       message: 'Success',
//       data: tours,
//     });
//   } catch (error) {
  //     res.status(404).send(error);
  //   }
  
// let newId = tours[tours.length - 1].id + 1;
// let newtour = Object.assign({ id: newId }, req.body);
// tours.push(newtour);

// fs.writeFile(
  //   '../dev-data/data/tours-simple.json',
//   JSON.stringify(tours),
//   (err) => {
  //     res.status(201).json({
    //       status: 'success',
    //       data: {
//         tour: newtour,
//       },
//     });
//   }
// );
// };
// exports.updateTour = async (req, res) => {
  //   try {
    //     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      //       new: true,
      //     });
//     res.status(200).json({
  //       status: 'success',
  //       data: {
//         tour,
//       },
//     });
//   } catch (error) {
  //     res.status(404).send(error);
  //   }
  // };
  exports.aliasTopTuors = (req, res, next) => {
    req.query.sort = '-ratingsAverage,price';
    req.query.limit = '5';
    req.query.fields = 'name,price,ratingsAverage,summary';
    next();
  };
exports.getAlltours=factory.getAll(Tour)
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);


exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    results:stats.length,
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});