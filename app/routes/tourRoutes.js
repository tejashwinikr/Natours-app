const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

//param middleware to handle params
// router.param("id", tourController.checkID);
// {
//   "name":"api test tour1",
//   "duration":5,
//   "maxGroupSize":25,
//   "difficulty":"easy"
//   }

//top 5 cheap tours
//http://localhost:3000/api/v1/tours/top-5-cheap
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getALLTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan,
  );

//route to find tours near u
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// /tours-distance?distance=233&center=-40,45&unit=mi
// /tours-distance/233/center/-40,45/unit/mi

router.route('/distance/:latlng/unit/:unit').get(tourController.getDistances);

//handling with route .method(function)
router
  .route('/')
  .get(tourController.getALLTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );

//handle with route id .method(fun)
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    // tourController.resizeTourImages,
    tourController.deleteTour,
  );

module.exports = router;
