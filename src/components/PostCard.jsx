import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { likesAPI, commentsAPI, postsAPI } from '../utils/api';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal,
  MapPin
} from 'lucide-react';
import CommentSection from './CommentSection';

const PostCard = ({ post, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (loading) return;

    const previousLiked = isLiked;
    const previousCount = likesCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      setLoading(true);
      const response = await likesAPI.toggleLike(post.id);
      
      if (onUpdate) {
        onUpdate({
          ...post,
          isLiked: response.data.isLiked,
          likesCount: response.data.likesCount
        });
      }
    } catch (error) {
      // Revert optimistic update
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (loading || !window.confirm('Are you sure you want to delete this post?')) return;

    try {
      setLoading(true);
      await postsAPI.deletePost(post.id);
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  return (
    <div className="card">
      {/* Post header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Link to={`/${post.username}`}>
            <img
              src={post.avatar ? `http://localhost:3001/uploads/avatars/${post.avatar}` : '/default-avatar.png'}
              alt={post.username}
              className="avatar avatar-md"
            />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <Link 
                to={`/${post.username}`}
                className="font-semibold text-sm hover:text-gray-500"
              >
                {post.username}
              </Link>
              {post.verified && (
                <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              )}
            </div>
            {post.location && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>{post.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Menu button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[120px]">
              {post.userId === user?.id ? (
                <>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                  <Link
                    to={`/p/${post.id}/edit`}
                    className="block w-full px-4 py-2 text-left hover:bg-gray-50"
                  >
                    Edit
                  </Link>
                </>
              ) : (
                <>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50">
                    Report
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50">
                    Unfollow
                  </button>
                </>
              )}
              <button
                onClick={() => setShowMenu(false)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post image */}
      <div className="relative">
        <img
          src={`http://localhost:3001/uploads/posts/${post.imageUrl}`}
          alt="Post"
          className="w-full aspect-square object-cover"
          onDoubleClick={handleLike}
        />
      </div>

      {/* Post actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={loading}
              className={`transition-colors ${isLiked ? 'text-red-500' : 'text-gray-700 hover:text-gray-500'}`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="text-gray-700 hover:text-gray-500"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            <button className="text-gray-700 hover:text-gray-500">
              <Send className="w-6 h-6" />
            </button>
          </div>
          <button className="text-gray-700 hover:text-gray-500">
            <Bookmark className="w-6 h-6" />
          </button>
        </div>

        {/* Likes count */}
        {likesCount > 0 && (
          <div className="font-semibold text-sm mb-2">
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </div>
        )}

        {/* Caption */}
        {post.caption && (
          <div className="text-sm mb-2">
            <Link 
              to={`/${post.username}`}
              className="font-semibold mr-2"
            >
              {post.username}
            </Link>
            <span>{post.caption}</span>
          </div>
        )}

        {/* Comments preview */}
        {post.commentsCount > 0 && (
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-gray-500 text-sm mb-2 hover:text-gray-700"
          >
            {showComments ? 'Hide comments' : `View all ${post.commentsCount} comments`}
          </button>
        )}

        {/* Time ago */}
        <div className="text-gray-400 text-xs">
          {formatTimeAgo(post.createdAt)}
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          onCommentAdded={(newCount) => {
            if (onUpdate) {
              onUpdate({
                ...post,
                commentsCount: newCount
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default PostCard;