let express = require('express');
let app = express();
let rateLimit = require('express-rate-limit');
let helmet = require('helmet');
let mongoSanitize = require('express-mongo-sanitize');
let xss = require('xss-clean');
let hpp = require('hpp');
let morgan = require('morgan');
let tourRouter = require('./routes/tourRoutes');
let userRouter = require('./routes/userRoutes');
let reviewRouter = require('./routes/reviewRoutes');
//?Middlewears

// Set security Http headers
app.use(helmet());

//development  logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// limit request from same API

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api', limiter);
//reading data from body into req.body

app.use(express.json());

//data sanitization against NOSQL query injection
app.use(mongoSanitize());

//data sanitization against XSS
app.use(xss());

// prevent http parameter pollution (?sort=duration,sort=price)
app.use(
  hpp({
    whiteList: [
      'duration',
      'maxGroupSize',
      'difficulty',
      'ratingsAverage',
      'ratingsQuantity',
      'price',
    ],
  })
);
//my Own module

app.use((req, res, next) => {
  console.log('hellow from the middlewear');
  next();
});

// test middleWear
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// app.use(express.static('./public')); //serving static files

// app.get('/api/v1/tours',getAlltours);
// app.post('/api/v1/tours',createNewTour);
// app.get('/api/v1/tours/:id',getTour);
// app.patch('/api/v1/tours/:id',updateTour);
// app.delete('/api/v1/tours/:id',deleteTour);
//?routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

module.exports = app;
