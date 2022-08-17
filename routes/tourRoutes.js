let express = require('express');
let authController = require('../controllers/authControllers');
let tourControllers = require('../controllers/tourControllers');
let reviewRouter = require('./../routes/reviewRoutes');
let router = express.Router();

// router.param('id', tourControllers.checkId);
router.use('/:tourId/reviews', reviewRouter);

router.route('/tourStats').get(tourControllers.getTourStats);
router
  .route('/monthly-Plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'guide', 'lead-guide'),
    tourControllers.getMonthlyPlan
  );
router
  .route('/top-5-cheap')
  .get(tourControllers.aliasTopTuors, tourControllers.getAlltours);

router
  .route('/')
  .get(tourControllers.getAlltours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControllers.createTour
  );

router
  .route('/:id')
  .get(tourControllers.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControllers.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead guide'),
    tourControllers.deleteTour
  );

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

module.exports = router;
