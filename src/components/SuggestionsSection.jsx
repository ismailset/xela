import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { followsAPI } from '../utils/api';

const SuggestionsSection = ({ suggestions, onFollowUpdate }) => {
  const [following, setFollowing] = useState({});
  const [loading, setLoading] = useState({});

  const handleFollow = async (user) => {
    if (loading[user.id]) return;

    setLoading(prev => ({ ...prev, [user.id]: true }));

    try {
      const response = await followsAPI.toggleFollow(user.id);
      setFollowing(prev => ({ ...prev, [user.id]: response.data.isFollowing }));
      
      if (onFollowUpdate) {
        onFollowUpdate(user.id, response.data.isFollowing);
      }
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setLoading(prev => ({ ...prev, [user.id]: false }));
    }
  };

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-500 text-sm">Suggestions For You</h3>
        <Link to="/explore" className="text-xs font-semibold text-gray-900 hover:text-gray-600">
          See All
        </Link>
      </div>

      <div className="space-y-3">
        {suggestions.map(user => (
          <div key={user.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to={`/${user.username}`}>
                <img
                  src={user.avatar ? `http://localhost:3001/uploads/avatars/${user.avatar}` : '/default-avatar.png'}
                  alt={user.username}
                  className="avatar avatar-sm"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/${user.username}`}
                  className="font-semibold text-sm text-gray-900 hover:text-gray-600 truncate block"
                >
                  {user.username}
                </Link>
                <p className="text-xs text-gray-500 truncate">
                  {user.fullName || 'Suggested for you'}
                </p>
                {user.followersCount > 0 && (
                  <p className="text-xs text-gray-400">
                    {user.followersCount} followers
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => handleFollow(user)}
              disabled={loading[user.id]}
              className={`text-xs font-semibold px-3 py-1 rounded ${
                following[user.id]
                  ? 'text-gray-700 border border-gray-300 hover:bg-gray-50'
                  : 'text-instagram-blue hover:text-blue-800'
              } transition-colors disabled:opacity-50`}
            >
              {loading[user.id] ? '...' : following[user.id] ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestionsSection;