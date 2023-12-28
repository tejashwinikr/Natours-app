const express = require('express');
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto
} = require('../controllers/userController');
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  protect,
  updatePassword,
  restrictTo,
  logout,
} = require('../controllers/authController');

const router = express.Router();

//no ndeed of login means no authorization and authentication
router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

//protects all the routes comes after this line middleware
router.use(protect);
router.patch('/updateMyPassword', updatePassword);
router.get('/me', getMe, getUser);
router.patch('/updateMe', uploadUserPhoto, 
//resizeUserPhoto
updateMe);
router.delete('/deleteMe', deleteMe);

//protects and resrticts to admin all the routes comes after this line middleware
router.use(restrictTo('admin'));
router.route('/').get(getAllUsers);

//handling users with single id
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
