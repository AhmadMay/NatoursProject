const express = require('express');
let reviewController = require('./../controllers/reviewController');
let authController = require('./../controllers/authControllers');
let router = express.Router({ mergeParams: true });

//tour/a32424sd/reviews
router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setDataToNest,
    reviewController.createReview
  );
router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteOne
  );

module.exports = router;
