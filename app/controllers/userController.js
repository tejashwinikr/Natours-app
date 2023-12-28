const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
//npm i multer,lesson 199 to upload files
const multer = require('multer');
//npm i sharp ,lesson 202 to resize image
// const sharp = require('sharp'); // "sharp": "^0.22.1",

//before sharp
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    //cb(err,destination) a callback fun
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    // user-id-timestamp.jpeg
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

//this way file will b stored in buffer,with sharp
// const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('not an image,please upload only images', 400), false);
  }
};

// const upload = multer({ dest: 'public/img/users' });// simple one

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

// exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
//   if (!req.file) return next();

//   req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

//  await sharp(req.file.buffer)
//     .resize(500, 500)
//     .toFormat('jpeg')
//     .jpeg({ quality: 90 })
//     .toFile(`public/img/users/${req.file.filename}`);
//   next();
// });

const filterObj = (obj, ...allowedFields) => {
  const newobj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newobj[el] = obj[el];
  });
  return newobj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //1)create error if user Post password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates.please use /updateMyPassword',
        400,
      ),
    );
  }

  //2) filtered unwanted fields that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  //3)update user
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    message: 'user updated',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(200).json({
    status: 'success',
    message: 'user delete',
  });
});

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);

//do Not upadte password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   //EXECUTE QUERY
//   const users = await User.find();

//   //3)SENDING RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: { users },
//     app: 'Natours',
//   });
// });
