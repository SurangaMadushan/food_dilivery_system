export const calculateCartTotals = (cartItems, quantities) => {
  const subtotal = cartItems.reduce(
    (acc, food) => acc + food.price * quantities[food.id],
    0,
  );
  const delivery = subtotal === 0 ? 0.0 : 350;
  const tax = subtotal * 0.1; //10%
  const total = subtotal + delivery + tax;

  return { subtotal, delivery, tax, total };
};
