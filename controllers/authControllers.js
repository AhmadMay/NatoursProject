const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('./../models/userModels');
const catchAsync = require('./../utils/catchAsync.js');
const appError = require('./../utils/appError');
const sendEmail = require('./../utils/emails');
const crypto = require('crypto');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};
exports.signUp = async (req, res) => {
  try {
    const newUser = await User.create(req.body);

    // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {    //signToken
    //   expiresIn: process.env.JWT_EXPIRES_IN,
    // });
    createSendToken(newUser, 201, res);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1 checking if email or password exist
  if (!email || !password) {
    return next(new appError('please enter email and password', 400));
  }
  //2 check if user exist and password is correct
  const user = await User.findOne({ email }).select('+password');
  //const correct = user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new appError('please enter correct email or password', 401));
  }
  //3 if everything okay then send token to client

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1 getting token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new appError('your are not logged in. Please log in first', 401)
    );
  }
  //2 verificaiton token
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3 check if user still exists
  const currentUser = await User.findById(decode.id);
  if (!currentUser) {
    return next(
      new appError('the user belonging to this token does no longer exist', 401)
    );
  }
  //4 check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decode.iat)) {
    return next(
      new appError('user recently changedpassword,please login again', 401)
    );
  }
  //here access to protected routes
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles=['admin','lead guide'], role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new appError('the User dont have permission to delete data'),
        403
      );
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  //1 get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new appError('there is no such user'), 404);
  }

  //2 generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3 send password to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/forgetpassword/${resetToken}`;

  const message = `Fogot your password submit a PATCH request with your 
  new password and passwordConfirm 
  to:${resetURL}.\nIf you did not forget your password please ignore this message`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to your email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new appError('there was an error sending email.Try again later'),
      500
    );
  }
  next();
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new appError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) Update changePassword property for the user

  // 4) log the user in , send JWT
  createSendToken(user, 201, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new appError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
