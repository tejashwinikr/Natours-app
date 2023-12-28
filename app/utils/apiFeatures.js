//class for certain operations
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;

    // console.log('this in class', this);
  }

  filter() {
    //1A)FILTERING
    const queryObj = { ...this.queryString }; //new object which wont effect the original one
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    //1B)ADVANCED FILTERING
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    //BUILD QUERY
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    //2)SORTING DATA
    if (this.queryString.sort) {
      //two fields sorter sort1,sort2,-sort3
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFileds() {
    //3)LIMITING FIELDS,getting only required field data,field,-field
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    //4)PAGINATION
    //page=3&limit=10.1-10 page 1 ,11-20 page2 ,21-30 page3
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
