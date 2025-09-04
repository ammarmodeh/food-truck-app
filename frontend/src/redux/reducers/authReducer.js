const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  user: null,
  error: null,
  message: null,
  isLoading: false, // Initialize as false to avoid initial loading state
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'REGISTER_SUCCESS':
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        error: null,
        message: null,
        isLoading: false,
      };
    case 'USER_LOADED':
    case 'USER_UPDATED':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        error: null,
        message: null,
        isLoading: false,
      };
    case 'FORGOT_PASSWORD_SUCCESS':
    case 'RESET_PASSWORD_SUCCESS':
      return {
        ...state,
        message: action.payload,
        error: null,
        isLoading: false,
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
        isLoading: false,
      };
    case 'LOGOUT':
    case 'AUTH_ERROR':
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        user: null,
        error: action.payload || null,
        message: null,
        isLoading: false,
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