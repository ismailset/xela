import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { Instagram, Eye, EyeOff, Check, X } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, [clearError]);

  // Check username availability with debounce
  useEffect(() => {
    const checkUsername = async () => {
      if (formData.username.length >= 3) {
        setCheckingUsername(true);
        try {
          const response = await authAPI.checkUsername(formData.username);
          setUsernameAvailable(response.data.available);
        } catch (error) {
          setUsernameAvailable(null);
        } finally {
          setCheckingUsername(false);
        }
      } else {
        setUsernameAvailable(null);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.username]);

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
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    } else if (!usernameAvailable) {
      newErrors.username = 'Username is not available';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const result = await register(formData);
    if (result.success) {
      navigate('/');
    }
  };

  const getUsernameIcon = () => {
    if (checkingUsername) {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>;
    }
    if (formData.username.length >= 3) {
      return usernameAvailable ? 
        <Check className="w-4 h-4 text-green-500" /> : 
        <X className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-instagram-bg flex items-center justify-center px-4 py-8">
      <div className="max-w-sm w-full">
        {/* Main register card */}
        <div className="card p-8 mb-4">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Instagram className="w-8 h-8 text-instagram-blue" />
              <h1 className="text-3xl font-bold gradient-text">Instagram</h1>
            </div>
            <p className="text-gray-500 text-sm font-semibold mb-4">
              Sign up to see photos and videos from your friends.
            </p>
          </div>

          {/* Register form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Full name field */}
            <div>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className={`input-field ${errors.fullName ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Username field */}
            <div className="relative">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                className={`input-field pr-10 ${errors.username ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getUsernameIcon()}
              </div>
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
              {formData.username.length >= 3 && usernameAvailable && (
                <p className="text-green-500 text-xs mt-1">Username is available</p>
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

            {/* Terms */}
            <div className="text-xs text-gray-500 text-center">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="text-instagram-blue hover:underline">
                Terms
              </Link>
              ,{' '}
              <Link to="/privacy" className="text-instagram-blue hover:underline">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link to="/cookies" className="text-instagram-blue hover:underline">
                Cookies Policy
              </Link>
              .
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !formData.username || !formData.email || !formData.password || !formData.fullName || !usernameAvailable}
              className="btn-primary w-full"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>
        </div>

        {/* Sign in link */}
        <div className="card p-4 text-center">
          <p className="text-sm text-gray-600">
            Have an account?{' '}
            <Link
              to="/login"
              className="text-instagram-blue font-semibold hover:underline"
            >
              Log in
            </Link>
          </p>
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

export default Register;