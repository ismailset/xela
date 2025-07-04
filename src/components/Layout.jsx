import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Search, 
  PlusSquare, 
  Heart, 
  User,
  LogOut,
  Instagram
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/explore', icon: Search, label: 'Explore' },
    { path: '/create', icon: PlusSquare, label: 'Create' },
    { path: '/notifications', icon: Heart, label: 'Notifications' },
    { path: `/${user?.username}`, icon: User, label: 'Profile' },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-instagram-bg">
      {/* Header for mobile */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-300">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center space-x-2">
            <Instagram className="w-6 h-6 text-instagram-blue" />
            <span className="text-xl font-bold gradient-text">Instagram</span>
          </Link>
          <div className="flex items-center space-x-4">
            <button className="p-2">
              <Heart className="w-6 h-6 text-gray-700" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2"
            >
              <LogOut className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar for desktop */}
        <nav className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:h-full lg:bg-white lg:border-r lg:border-gray-300">
          <div className="p-6">
            <Link to="/" className="flex items-center space-x-3">
              <Instagram className="w-8 h-8 text-instagram-blue" />
              <span className="text-2xl font-bold gradient-text">Instagram</span>
            </Link>
          </div>

          <div className="flex-1 px-3">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                  isActive(path)
                    ? 'bg-gray-100 font-semibold'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive(path) ? 'text-black' : 'text-gray-700'}`} />
                <span className={`${isActive(path) ? 'text-black' : 'text-gray-700'}`}>
                  {label}
                </span>
              </Link>
            ))}

            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-3 py-3 rounded-lg mb-1 w-full text-left hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-6 h-6 text-gray-700" />
              <span className="text-gray-700">Logout</span>
            </button>
          </div>

          <div className="p-3 border-t border-gray-200">
            <Link
              to={`/${user?.username}`}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50"
            >
              <img
                src={user?.avatar ? `http://localhost:3001/uploads/avatars/${user.avatar}` : '/default-avatar.png'}
                alt={user?.username}
                className="avatar avatar-sm"
              />
              <div>
                <p className="font-semibold text-sm">{user?.username}</p>
                <p className="text-gray-500 text-xs">{user?.fullName}</p>
              </div>
            </Link>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
          {children}
        </main>

        {/* Bottom navigation for mobile */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300">
          <div className="flex justify-around py-2">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center py-2 px-3 ${
                  isActive(path) ? 'text-black' : 'text-gray-500'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Layout;