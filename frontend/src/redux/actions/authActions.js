import axios from 'axios';

export const register = (formData) => async (dispatch) => {
  try {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const res = await axios.post(`${import.meta.env.VITE_BACKEND_API}/api/auth/register`, formData, config);
    dispatch({ type: 'REGISTER_SUCCESS', payload: res.data });
    dispatch(loadUser());
  } catch (err) {
    dispatch({ type: 'REGISTER_FAIL', payload: err.response?.data?.msg });
  }
};

export const login = (formData) => async (dispatch) => {
  try {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const res = await axios.post(`${import.meta.env.VITE_BACKEND_API}/api/auth/login`, formData, config);
    dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
    dispatch(loadUser());
  } catch (err) {
    dispatch({ type: 'LOGIN_FAIL', payload: err.response?.data?.msg });
  }
};

export const forgotPassword = (formData) => async (dispatch) => {
  try {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const res = await axios.post(`${import.meta.env.VITE_BACKEND_API}/api/auth/forgot-password`, formData, config);
    dispatch({ type: 'FORGOT_PASSWORD_SUCCESS', payload: res.data.msg });
  } catch (err) {
    dispatch({ type: 'FORGOT_PASSWORD_FAIL', payload: err.response?.data?.msg || 'Failed to send reset email' });
  }
};

export const resetPassword = (formData) => async (dispatch) => {
  try {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const res = await axios.post(`${import.meta.env.VITE_BACKEND_API}/api/auth/reset-password`, formData, config);
    dispatch({ type: 'RESET_PASSWORD_SUCCESS', payload: res.data.msg });
  } catch (err) {
    dispatch({ type: 'RESET_PASSWORD_FAIL', payload: err.response?.data?.msg || 'Failed to reset password' });
  }
};

export const loadUser = () => async (dispatch) => {
  if (localStorage.token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.token}`;
  }
  try {
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/auth/user`);
    dispatch({ type: 'USER_LOADED', payload: res.data });
  } catch (err) {
    dispatch({ type: 'AUTH_ERROR' });
  }
};

export const updateUser = (formData) => async (dispatch) => {
  try {
    const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` } };
    const res = await axios.put(`${import.meta.env.VITE_BACKEND_API}/api/auth/update`, formData, config);
    dispatch({ type: 'USER_UPDATED', payload: res.data.user });
    dispatch({ type: 'CLEAR_ERRORS' });
    return res.data;
  } catch (err) {
    dispatch({ type: 'UPDATE_FAIL', payload: err.response?.data?.msg || 'Failed to update profile' });
    throw err;
  }
};

export const clearErrors = () => (dispatch) => {
  dispatch({ type: 'CLEAR_ERRORS' });
};

export const logout = () => (dispatch) => dispatch({ type: 'LOGOUT' });