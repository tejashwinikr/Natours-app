const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser'); //npm i cookie-parser lesson189

const AppError = require('./app/utils/appError');
const globalErrorHandler = require('./app/controllers/errorContoller');
const tourRouter = require('./app/routes/tourRoutes');
const userRouter = require('./app/routes/userRoutes');
const reviewRouter = require('./app/routes/reviewRoutes');
const viewRouter = require('./app/routes/viewRoute');
const bookingRouter = require('./app/routes/bookingRoutes');

const app = express();

const cors = require('cors');

app.use(cors());

//npm i pug lesson 176
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, './app/views'));

//1)GLOBAL MIDDLEWARES

//static file serving using express
app.use(express.static(path.join(__dirname, 'public')));

//set security HTTP headers
app.use(helmet());

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); //'tiny'
}

//limiting requests from same for /api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP,Please try again in an hour',
});
app.use('/api', limiter);

//gives api route ,timetook,statuscode
app.use(morgan('dev'));
//Body parser,reading data from body into req.body
app.use(express.json({ limit: '10kb' })); //middleware that modifies the request to json
app
  .use(express.urlencoded({ extended: true, limit: '10kb' }))
  .use(cookieParser());

//Data sanitization against NoSQL injections
app.use(mongoSanitize());

//Data sanitization files
app.use(xss());

//hpp middleware prevent paramter pollution sort has 2 values will consider last one
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

//using middleware applies to all apis
// but wont work if we define it after the api route
//orders really matters in express
// app.use((req, res, next) => {
//   console.log("hello from the middle ware");
//   next();
// });

//miidleware to manipulate request.test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

//3)ROUTES

// //mounting routers
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//HANDLING NOT DEFINED ROUTES
//we have defined the routes and this
// code will execute only when none of the above matches
//so we must define it at last
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'FAIL',
  //   message: `Can't find ${req.originalUrl}`,
  //   app: 'Natours',
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'FAIL';
  // err.statusCode = 404; next(err)
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
