const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../app/models/tourModel');
const User = require('../../app/models/userModel');
const Review = require('../../app/models/reviewModel');

dotenv.config({ path: './config.env' });

//connecting db
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => {
    // console.log(con.connections);
    console.log('db connection successfull');
  })
  .catch((err) => {
    console.log('error in db connection', err);
  });

//READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);

console.log(`${__dirname}/tours.json`);
//IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data loaded successfully!! ');
  } catch (err) {
    console.log('err in storing to db ', err);
  }
  process.exit();
};

//DELETE DATA FROM DB node dev-data/data/import-dev-data.js --import
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data deleted Successfully. ');
  } catch (err) {
    console.log('err in storing to db ', err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
// console.log(process.argv);node ./dev-data/data/import-dev-data.js --import
