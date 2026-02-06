import React, { useContext, useState } from "react";
import "./PlaceOrder.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { calculateCartTotals } from "../../util/cartUtils";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../../service/orderService"; // We don't need verifyPayment here anymore
import { clearCartItems } from "../../service/cartService";

const PlaceOrder = () => {
  const { foodList, quantities, setQuantities, token } =
    useContext(StoreContext);
  const navigate = useNavigate();

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    state: "",
    city: "",
    zip: "",
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    // 1. Prepare the data for the backend
    const orderData = {
      userAddress: `${data.firstName} ${data.lastName}, ${data.address}, ${data.city}, ${data.state}, ${data.zip}`,
      phoneNumber: data.phoneNumber,
      email: data.email,
      orderedItems: cartItems.map((item) => ({
        foodId: item.foodId,
        quantity: quantities[item.id],
        price: item.price * quantities[item.id],
        category: item.category,
        imageUrl: item.imageUrl,
        description: item.description,
        name: item.name,
      })),
      amount: total.toFixed(2),
      orderStatus: "Preparing",
    };

    try {
      // 2. Call backend: It saves the order and returns PayHere Hash + Params
      const payHereParams = await createOrder(orderData, token);

      if (payHereParams && payHereParams.hash) {
        // 3. Start the PayHere Payment Popup
        initiatePayHerePayment(payHereParams);
      } else {
        toast.error("Unable to initiate payment. Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error connecting to server.");
    }
  };

  // --- NEW: PayHere Logic ---
  const initiatePayHerePayment = (paymentData) => {
    // Check if PayHere SDK is loaded
    if (!window.payhere) {
      toast.error("PayHere SDK not loaded. Check your internet connection.");
      return;
    }

    // A. Define what happens on SUCCESS
    window.payhere.onCompleted = function onCompleted(orderId) {
      console.log("Payment completed. OrderID:" + orderId);
      toast.success("Payment Successful!");

      // Clear cart and redirect
      clearCart();
      navigate("/myorders");
    };

    // B. Define what happens on DISMISS (User closes popup)
    window.payhere.onDismissed = function onDismissed() {
      console.log("Payment dismissed");
      toast.info("Payment was cancelled.");
    };

    // C. Define what happens on ERROR
    window.payhere.onError = function onError(error) {
      console.log("Error:" + error);
      toast.error("Payment Failed: " + error);
    };

    // D. Open the Popup
    window.payhere.startPayment(paymentData);
  };

  const clearCart = async () => {
    try {
      await clearCartItems(token, setQuantities);
    } catch (error) {
      toast.error("Error while clearing the cart.");
    }
  };

  // --- Standard Cart Logic (Unchanged) ---
  const cartItems = foodList.filter((food) => quantities[food.id] > 0);
  const { subtotal, delivery, tax, total } = calculateCartTotals(
    cartItems,
    quantities,
  );

  return (
    <div className="container mt-4">
      <main>
        <div className="py-5 text-center">
          <img
            className="d-block mx-auto"
            src={assets.logo}
            alt=""
            width="98"
            height="98"
          />
        </div>
        <div className="row g-5">
          {/* Cart Summary Section */}
          <div className="col-md-5 col-lg-4 order-md-last">
            <h4 className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-primary">Your cart</span>
              <span className="badge bg-primary rounded-pill">
                {cartItems.length}
              </span>
            </h4>
            <ul className="list-group mb-3">
              {cartItems.map((item) => (
                <li
                  key={item.id}
                  className="list-group-item d-flex justify-content-between lh-sm"
                >
                  <div>
                    <h6 className="my-0">{item.name}</h6>
                    <small className="text-body-secondary">
                      Qty: {quantities[item.id]}
                    </small>
                  </div>
                  <span className="text-body-secondary">
                    Rs.{item.price * quantities[item.id]}
                  </span>
                </li>
              ))}
              <li className="list-group-item d-flex justify-content-between">
                <div>
                  <span>Delivery</span>
                </div>
                <span className="text-body-secondary">
                  Rs.{subtotal === 0 ? 0.0 : delivery.toFixed(2)}
                </span>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <div>
                  <span>Tax (10%)</span>
                </div>
                <span className="text-body-secondary">Rs.{tax.toFixed(2)}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>Total (Rs.)</span>
                {/* Note: PayHere might display LKR on the popup, ensure backend sends LKR or USD appropriately */}
                <strong>Rs.{total.toFixed(2)}</strong>
              </li>
            </ul>
          </div>

          {/* Billing Form Section */}
          <div className="col-md-7 col-lg-8">
            <h4 className="mb-3">Billing address</h4>
            <form className="needs-validation" onSubmit={onSubmitHandler}>
              <div className="row g-3">
                <div className="col-sm-6">
                  <label htmlFor="firstName" className="form-label">
                    First name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="firstName"
                    name="firstName"
                    value={data.firstName}
                    onChange={onChangeHandler}
                    required
                  />
                </div>

                <div className="col-sm-6">
                  <label htmlFor="lastName" className="form-label">
                    Last name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="lastName"
                    name="lastName"
                    value={data.lastName}
                    onChange={onChangeHandler}
                    required
                  />
                </div>

                <div className="col-12">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={data.email}
                    onChange={onChangeHandler}
                    required
                  />
                </div>

                <div className="col-12">
                  <label htmlFor="phone" className="form-label">
                    Phone Number
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="phone"
                    name="phoneNumber"
                    value={data.phoneNumber}
                    onChange={onChangeHandler}
                    required
                  />
                </div>

                <div className="col-12">
                  <label htmlFor="address" className="form-label">
                    Address
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="address"
                    name="address"
                    value={data.address}
                    onChange={onChangeHandler}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label htmlFor="city" className="form-label">
                    City
                  </label>
                  <select
                    className="form-select"
                    id="city"
                    required
                    name="city"
                    value={data.city}
                    onChange={onChangeHandler}
                  >
                    <option value="">Choose...</option>
                    <option value="Colombo">Colombo</option>
                    <option value="Kelaniya">Kelaniya</option>
                    <option value="Kiribathgoda">Kiribathgoda</option>
                    <option value="Kadawatha">Kadawatha</option>
                  </select>
                </div>
              </div>

              <hr className="my-4" />

              <button
                className="w-100 btn btn-primary btn-lg"
                type="submit"
                disabled={cartItems.length === 0}
              >
                Pay with PayHere
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlaceOrder;
