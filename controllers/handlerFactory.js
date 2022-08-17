let catchAsync = require('./../utils/catchAsync');
let appError = require('./../utils/appError');
let APIFeatures = require('./../utils/APIFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);

      if (!doc) {
        return next(new appError('No document has been found', 404));
      }
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      res.status(404).send(error);
    }
  });

exports.updateOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!doc) {
      return next(new appError('there is no such a document', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  } catch (error) {
    res.status(404).send(error);
  }
};

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    let doc = await Model.create(req.body);
    console.log(doc);

    res.status(201).json({
      status: 'Success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    //   const tours = await Model.findById(req.params.id).populate('reviews');

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //allow nested routes to get reviews on Tour small hack
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    
    //?execute query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    let doc = await features.query;

    res.status(200).json({
      status: 'success',
      time: req.requestTime,
      results: doc.length,
      data: {
        doc,
      },
    });
  });
