const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModels');
const appError = require('./../utils/appError');
const factory = require('./handlerFactory');
let multer = require('multer');

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users/');
  },
  filename: (req, file, cb) => {
    const newName = Date.now() + '-' + file.originalname;
    cb(null, newName);
  },
});

const upload = multer({ storage: diskStorage });

exports.uploadUserImage = upload.single('photo'); // for single file uploading
// exports.uploadUserImage = upload.array('photos'); // for multiple file uploading

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((element) => {
    if (allowedFields.includes(element)) newObj[element] = obj[element];
  });
  return newObj;
};

// exports.getAllUser = catchAsync(async (req, res, next) => {
//   let users = await User.find();

//   res.status(200).json({
//     status: 'success',
//     result: users.length,
//     data: {
//       users,
//     },
//   });
// });

exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);
  console.log(req.body.photo);
  // 1)create error if user posts Password's data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new appError(
        'this route is not for updating password.Please got to /updatepassword',
        400
      )
    );
  }
  // 2) filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email', 'photo');

  if (req.file) req.body.photo = req.file.originalname;
  // 3) update user document

  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });

  //   await User.findByIdAndUpdate(req.user.id, { active: false });

  //   res.status(204).json({
  //     status: 'success',
  //     data: null
  //   });
});

exports.createNewUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    Message: 'this route is not yet defined/please use sign up',
  });
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     Message: 'this route is not yet defined',
//   });
// };
// exports.UpdateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     Message: 'this route is not yet defined',
//   });
// };
exports.getAllUser = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.createNewUser = factory.createOne(User);
exports.UpdateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
