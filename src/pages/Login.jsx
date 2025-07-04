import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Instagram, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const result = await login(formData);
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-instagram-bg flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        {/* Main login card */}
        <div className="card p-8 mb-4">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Instagram className="w-8 h-8 text-instagram-blue" />
              <h1 className="text-3xl font-bold gradient-text">Instagram</h1>
            </div>
            <p className="text-gray-500 text-sm">
              Share your moments with the world
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username field */}
            <div>
              <input
                type="text"
                name="username"
                placeholder="Username or email"
                value={formData.username}
                onChange={handleChange}
                className={`input-field ${errors.username ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            {/* Password field */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={`input-field pr-10 ${errors.password ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !formData.username || !formData.password}
              className="btn-primary w-full"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Forgot password */}
          <div className="text-center mt-6">
            <Link
              to="/forgot-password"
              className="text-instagram-blue text-sm hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Sign up link */}
        <div className="card p-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-instagram-blue font-semibold hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Demo accounts */}
        <div className="card p-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Demo Accounts:</h3>
          <div className="space-y-1 text-xs text-gray-600">
            <p>Username: demo_user | Password: demo123</p>
            <p>Username: john_doe | Password: john123</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            Instagram Clone © 2024
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;