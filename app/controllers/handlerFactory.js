const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Modal) =>
  catchAsync(async (req, res, next) => {
    const doc = await Modal.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: 'null',
    });
  });

exports.updateOne = (Modal) =>
  catchAsync(async (req, res, next) => {
    const doc = await Modal.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //to return updated Modal
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: { doc },
    });
  });

exports.createOne = (Modal) =>
  catchAsync(async (req, res, next) => {
    const doc = await Modal.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { data: doc },
    });
  });

exports.getOne = (Modal, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Modal.findById(req.params.id);
    if (popOptions) query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { data: doc },
    });
  });

exports.getAll = (Modal) =>
  catchAsync(async (req, res, next) => {
    //to allow for nested to GET reviews on tour(hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    //EXECUTE QUERY
    const features = new APIFeatures(Modal.find(filter), req.query)
      .filter()
      .sort()
      .limitFileds()
      .paginate();

    const doc = await features.query;

    // const doc = await features.query.explain(); gives explanations

    //3)SENDING RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: { data: doc },
    });
  });
