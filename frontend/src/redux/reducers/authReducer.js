const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  user: null,
  error: null,
  message: null,
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'REGISTER_SUCCESS':
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        ...action.payload,
        isAuthenticated: true,
        error: null,
        message: null,
      };
    case 'USER_LOADED':
    case 'USER_UPDATED':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        error: null,
        message: null,
      };
    case 'FORGOT_PASSWORD_SUCCESS':
    case 'RESET_PASSWORD_SUCCESS':
      return {
        ...state,
        message: action.payload,
        error: null,
      };
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'UPDATE_FAIL':
    case 'FORGOT_PASSWORD_FAIL':
    case 'RESET_PASSWORD_FAIL':
      return {
        ...state,
        error: action.payload,
        message: null,
      };
    case 'LOGOUT':
    case 'AUTH_ERROR':
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        user: null,
        error: null,
        message: null,
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        error: null,
        message: null,
      };
    default:
      return state;
  }
};

export default authReducer;