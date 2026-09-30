const axios = require('axios');

// 1. Basic configuration of the Axios instance
const api = axios.create({
  baseURL: 'http://localhost:3000/api/users', // The base URL is defined here once and for all
  headers: {
    'Content-Type': 'application/json'
  }
});

// 2. Mapping HTTP requests to simple JavaScript functions
const userService = {
  // Map the global GET request
  getAllUsers: async () => {
    return await api.get('/');
  },

  // Map the dynamic GET request (by ID)
  getUserById: async (id) => {
    return await api.get(`/${id}`);
  },

  // Map the POST request (Creation)
  createUser: async (userData) => {
    return await api.post('/', userData);
  },

  // Map the dynamic PUT request (Update)
  updateUser: async (id, updateData) => {
    return await api.put(`/${id}`, updateData);
  },

  // Map the DELETE request
  deleteUser: async (id) => {
    return await api.delete(`/${id}`);
  },

  // Map the nested requests (Workouts)
  addWorkout: async (id, workoutData) => {
    return await api.post(`/${id}/workouts`, workoutData);
  },

  getWorkouts: async (id) => {
    return await api.get(`/${id}/workouts`);
  }
};

module.exports = userService;