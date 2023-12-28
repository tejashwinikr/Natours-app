const express = require('express');
// const fs = require("fs");
const app = express();
const Tour = require('../models/tourModel');
// const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
//npm i multer,lesson 204 to upload files
const multer = require('multer');
//npm i sharp ,lesson 204 to resize image
// const sharp = require('sharp');

//this way file will b stored in buffer,with sharp
// const multerStorage = multer.memoryStorage();

app.use(express.json());
// app.use(morgan("dev")); //'tiny'
// app.use(express.json()); //middleware that modifies the request to json

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../../dev-data/data/tours-simple.json`)
// );

//before sharp
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    //cb(err,destination) a callback fun
    cb(null, 'public/img/tours');
  },
  filename: (req, file, cb) => {
    // user-id-timestamp.jpeg
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('not an image,please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 1 },
]);

//upload.single('image') req.file
//upload.array('images',5) req.files

//to resize images when sharp works
// exports.resizeTourImages = catchAsync(async (req, res, next) => {
//   if (!req.files.imageCover || !req.files.images) return next();

//   // 1) Cover image
//   req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
//   await sharp(req.files.imageCover[0].buffer)
//     .resize(2000, 1333)
//     .toFormat('jpeg')
//     .jpeg({ quality: 90 })
//     .toFile(`public/img/tours/${req.body.imageCover}`);

//   // 2) Images
//   req.body.images = [];

//   await Promise.all(
//     req.files.images.map(async (file, i) => {
//       const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

//       await sharp(file.buffer)
//         .resize(2000, 1333)
//         .toFormat('jpeg')
//         .jpeg({ quality: 90 })
//         .toFile(`public/img/tours/${filename}`);

//       req.body.images.push(filename);
//     }),
//   );

//   next();
// });

//MIIDLEWARE OF ALIAS
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summmary,difficulty';
  next();
};

exports.getALLTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

//aggregation pipeline stats of data
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        // _id: '$difficulty',//null,
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    app: 'natours',
    data: {
      stats: stats,
    },
    message: 'stats done',
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 6,
    },
  ]);

  console.log('year', plan);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
    message: 'get monthly plan done',
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
//lesson 171
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitute and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

//lesson 172
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});

// //1A)FILTERING

// console.log(queryObj, req.query);
// const tours = await Tour.find({
//   duration: 5,
//   difficulty: 'easy',
// });

// const tours = await Tour.find()
//   .where('duration')
//   .equals(5)
//   .where('difficulty')
//   .equals('easy');

// const queryObj = { ...req.query }; //new object which wont effect the original one
// const excludedFields = ['page', 'sort', 'limit', 'fields'];
// excludedFields.forEach((el) => delete queryObj[el]);

// //1B)ADVANCED FILTERING
// let queryStr = JSON.stringify(queryObj);
// queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

// //BUILD QUERY
// let query = Tour.find(JSON.parse(queryStr));

// //2)SORTING DATA
// if (req.query.sort) {
//   //two fields sorter sort1,sort2,-sort3
//   const sortBy = req.query.sort.split(',').join(' ');
//   query = query.sort(sortBy);
// } else {
//   query = query.sort('-createdAt');
// }

// //3)LIMITING FIELDS,getting only required field data,field,-field
// if (req.query.fields) {
//   const fields = req.query.fields.split(',').join(' ');
//   query = query.select(fields);
// } else {
//   query = query.select('-__v');
// }

// //4)PAGINATION
// //page=3&limit=10.1-10 page 1 ,11-20 page2 ,21-30 page3
// const page = req.query.page * 1 || 1;
// const limit = req.query.limit * 1 || 100;
// const skip = (page - 1) * limit;
// query = query.skip(skip).limit(limit);

// if (req.query.page) {
//   const numTours = await Tour.countDocuments();
//   if (skip >= numTours) {
//     throw new Error('this page does not exist');
//   }
// }

//handle factory before code
// exports.createTour = catchAsync(async (req, res, next) => {
//   // const newTour = new Tour({});
//   // newTour.save()
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: { newTour },
//     message: 'new tour added',
//     app: 'Natours',
//   });
// });

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true, //to return updated tour
//     runValidators: true,
//   });

//   if (!updatedTour) {
//     return next(new AppError('No tour with that ID', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     app: 'natours',
//     message: 'updated object with id ' + req.params.id,
//     data: { tour: updatedTour },
//   });
// });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     app: 'natours',
//     message: 'deleted object with id ' + req.params.id,
//   });
// });

// exports.getTour = catchAsync(async (req, res, next) => {

//   const tour = await Tour.findById(req.params.id).populate('reviews');

//   //Tour.findOne({_id:req.paramas.id *1})
//   if (!tour) {
//     return next(new AppError('No tour with that ID', 404));
//   }
//   //Tour.findOne({_id:req.params.id})
//   res.status(200).json({
//     status: 'success',
//     data: { tour },
//     message: '1 tour fetched',
//     app: 'Natours',
//   });
// });

// exports.getALLTours = catchAsync(async (req, res, next) => {
//   //EXECUTE QUERY
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFileds()
//     .paginate();

//   const tours = await features.query;

//   //3)SENDING RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: { tours },
//     message: 'all tours are here',
//     app: 'Natours',
//   });
// });
