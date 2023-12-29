/* eslint-disable prettier/prettier */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

//handling error on uncaught exception
process.on('uncaughtException', (err) => {
  console.log('UNHANDLED EXCEPTION SHUTTING THE SERVER 111');
  console.log("12233",err);
  console.log(err.name, err.message);
  process.exit(1); //0 for suceess . 1 for unhandle rejection
});

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

const app = require('./index');

// console.log(app.get('env'))//npm i dotenv

// console.log(process.env)
//4)START THE SERVER
const port = process.env.PORT || 3000;
//server setting
const server = app.listen(port, () => {
  console.log(`nodejs demo project running on port ${port}`);
});

//stopping the SERVER on unhadledrejection
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION SHUTTING THE SERVER 222');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1); //0 for suceess . 1 for unhandle rejection
  });
  //process.exit(1)//0 for suceess . 1 for unhandle rejection
});
