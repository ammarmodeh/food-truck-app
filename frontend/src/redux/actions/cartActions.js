export const addToCart = (item, qty = 1) => (dispatch) => {
  dispatch({ type: 'ADD_TO_CART', payload: { item, qty } });
};

export const adjustCartQuantity = (id, qty) => (dispatch) => {
  dispatch({ type: 'ADJUST_CART_QUANTITY', payload: { id, qty } });
};

export const removeFromCart = (id) => (dispatch) => {
  dispatch({ type: 'REMOVE_FROM_CART', payload: id });
};

export const clearCart = () => (dispatch) => {
  dispatch({ type: 'CLEAR_CART' });
};