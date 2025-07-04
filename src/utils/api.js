import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  checkUsername: (username) => api.get(`/auth/check-username/${username}`),
};

// Users API
export const usersAPI = {
  getProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (formData) => api.put('/users/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  searchUsers: (query) => api.get(`/users/search/${query}`),
  getFollowers: (username) => api.get(`/users/${username}/followers`),
  getFollowing: (username) => api.get(`/users/${username}/following`),
};

// Posts API
export const postsAPI = {
  createPost: (formData) => api.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getFeed: (page = 1, limit = 10) => api.get(`/posts/feed?page=${page}&limit=${limit}`),
  getExplore: (page = 1, limit = 20) => api.get(`/posts/explore?page=${page}&limit=${limit}`),
  getUserPosts: (username) => api.get(`/posts/user/${username}`),
  getPost: (postId) => api.get(`/posts/${postId}`),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
};

// Comments API
export const commentsAPI = {
  addComment: (postId, content) => api.post('/comments', { postId, content }),
  getComments: (postId, page = 1, limit = 20) => api.get(`/comments/post/${postId}?page=${page}&limit=${limit}`),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
  getCommentCount: (postId) => api.get(`/comments/count/${postId}`),
};

// Likes API
export const likesAPI = {
  toggleLike: (postId) => api.post('/likes/toggle', { postId }),
  getLikes: (postId, page = 1, limit = 20) => api.get(`/likes/post/${postId}?page=${page}&limit=${limit}`),
  getLikeCount: (postId) => api.get(`/likes/count/${postId}`),
  checkLike: (postId) => api.get(`/likes/check/${postId}`),
};

// Follows API
export const followsAPI = {
  toggleFollow: (userId) => api.post('/follows/toggle', { userId }),
  getSuggestions: (limit = 10) => api.get(`/follows/suggestions?limit=${limit}`),
  checkFollow: (userId) => api.get(`/follows/check/${userId}`),
  getMutual: (userId) => api.get(`/follows/mutual/${userId}`),
  getCounts: (userId) => api.get(`/follows/counts/${userId}`),
};

export default api;