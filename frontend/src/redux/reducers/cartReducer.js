const initialState = {
  cartItems: localStorage.getItem('cartItems') ? JSON.parse(localStorage.getItem('cartItems')) : [],
};

const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { item, qty } = action.payload;
      const existItem = state.cartItems.find((x) => x._id === item._id);
      let newCartItems;
      if (existItem) {
        newCartItems = state.cartItems.map((x) =>
          x._id === item._id ? { ...x, qty: x.qty + qty } : x
        );
      } else {
        newCartItems = [...state.cartItems, { ...item, qty }];
      }
      localStorage.setItem('cartItems', JSON.stringify(newCartItems));
      return { ...state, cartItems: newCartItems };
    }
    case 'ADJUST_CART_QUANTITY': {
      const { id, qty } = action.payload;
      let newCartItems;
      if (qty <= 0) {
        newCartItems = state.cartItems.filter((x) => x._id !== id);
      } else {
        newCartItems = state.cartItems.map((x) =>
          x._id === id ? { ...x, qty } : x
        );
      }
      localStorage.setItem('cartItems', JSON.stringify(newCartItems));
      return { ...state, cartItems: newCartItems };
    }
    case 'REMOVE_FROM_CART': {
      const filteredItems = state.cartItems.filter((x) => x._id !== action.payload);
      localStorage.setItem('cartItems', JSON.stringify(filteredItems));
      return { ...state, cartItems: filteredItems };
    }
    case 'CLEAR_CART': {
      localStorage.removeItem('cartItems');
      return { ...state, cartItems: [] };
    }
    default:
      return state;
  }
};

export default cartReducer;