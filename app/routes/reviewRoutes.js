const express = require('express');
const authController = require('../controllers/authController');
const reviewContoller = require('../controllers/reviewContoller');

const router = express.Router({ mergeParams: true });

// router.use(authController.protect);

router
  .route('/')
  .get(reviewContoller.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewContoller.setTourUserIds,
    reviewContoller.createReview,
  );

router
  .route('/:id')
  .get(reviewContoller.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewContoller.updateReview,
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewContoller.deleteReview,
  );

module.exports = router;
