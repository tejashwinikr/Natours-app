/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = stripe('pk_test_51OSCXVSGpLsDYBXZFLQKmdqzY8VGbnrw6Ww6ClY4GxUBqcl11P17Ck3nePNm1RG4GY2EZdGEaIXI8CXeHXve7PnO00rEx8bjOg');

export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
