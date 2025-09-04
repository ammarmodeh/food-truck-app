import axios from 'axios';

export const register = (formData) => async (dispatch) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    const config = { headers: { 'Content-Type': 'application/json' } };
    const res = await axios.post(`${import.meta.env.VITE_BACKEND_API}/api/auth/register`, formData, config);
    dispatch({ type: 'REGISTER_SUCCESS', payload: res.data });
    dispatch(loadUser());
  } catch (err) {
    dispatch({ type: 'REGISTER_FAIL', payload: err.response?.data?.msg || 'Registration failed' });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false });
  }
};

export const login = (formData) => async (dispatch) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    const config = { headers: { 'Content-Type': 'application/json' } };
    // console.log({ formData });
    const res = await axios.post(`${import.meta.env.VITE_BACKEND_API}/api/auth/login`, formData, config);
    dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
    dispatch(loadUser());
  } catch (err) {
    const errorMsg = err.response?.data?.msg || 'Login failed';
    dispatch({ type: 'LOGIN_FAIL', payload: errorMsg });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false });
  }
};

export const forgotPassword = (formData) => async (dispatch) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    const config = { headers: { 'Content-Type': 'application/json' } };
    const res = await axios.post(`${import.meta.env.VITE_BACKEND_API}/api/auth/forgot-password`, formData, config);

    // Return the reset token to the component
    return {
      resetToken: res.data.resetToken,
      msg: res.data.msg
    };
  } catch (err) {
    const errorMsg = err.response?.data?.msg || 'Failed to send reset OTP';
    dispatch({ type: 'FORGOT_PASSWORD_FAIL', payload: errorMsg });
    throw err;
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false });
  }
};

export const resetPassword = (formData) => async (dispatch) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    const config = { headers: { 'Content-Type': 'application/json' } };
    const res = await axios.post(`${import.meta.env.VITE_BACKEND_API}/api/auth/reset-password`, formData, config);
    dispatch({ type: 'RESET_PASSWORD_SUCCESS', payload: res.data.msg });
  } catch (err) {
    dispatch({ type: 'RESET_PASSWORD_FAIL', payload: err.response?.data?.msg || 'Failed to reset password' });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false });
  }
};

export const loadUser = () => async (dispatch) => {
  if (localStorage.token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.token}`;
  } else {
    dispatch({ type: 'AUTH_ERROR' });
    dispatch({ type: 'SET_LOADING', payload: false });
    return;
  }

  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/auth/user`);
    dispatch({ type: 'USER_LOADED', payload: res.data });
  } catch (err) {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    dispatch({ type: 'AUTH_ERROR', payload: err.response?.data?.msg || 'Failed to load user' });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false });
  }
};

export const updateUser = (formData) => async (dispatch) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    };
    const res = await axios.put(`${import.meta.env.VITE_BACKEND_API}/api/auth/update`, formData, config);
    dispatch({ type: 'USER_UPDATED', payload: res.data.user });
    dispatch({ type: 'CLEAR_ERRORS' });
    return res.data;
  } catch (err) {
    dispatch({ type: 'UPDATE_FAIL', payload: err.response?.data?.msg || 'Failed to update profile' });
    throw err;
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false });
  }
};

export const clearErrors = () => (dispatch) => {
  dispatch({ type: 'CLEAR_ERRORS' });
};

export const logout = () => (dispatch) => {
  localStorage.removeItem('token');
  delete axios.defaults.headers.common['Authorization'];
  dispatch({ type: 'LOGOUT' });
};