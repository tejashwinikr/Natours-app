//TRY CATCH BLOCK REPLACEMENT
const catchAsync = (fn) => {
  return (req, res, next) => {
    //catches error and calls global

    // fn(req, res, next).catch(next);
    fn(req, res, next).catch((err) => 
    { console.log("err in catchasync",err)
      next(err)});
  };
};

module.exports = catchAsync;
