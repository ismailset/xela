import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { commentsAPI } from '../utils/api';
import { Heart, MoreHorizontal } from 'lucide-react';

const CommentSection = ({ postId, onCommentAdded }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await commentsAPI.getComments(postId);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      const response = await commentsAPI.addComment(postId, newComment.trim());
      setComments(prev => [...prev, response.data.comment]);
      setNewComment('');
      
      if (onCommentAdded) {
        onCommentAdded(comments.length + 1);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsAPI.deleteComment(commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      
      if (onCommentAdded) {
        onCommentAdded(comments.length - 1);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
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
    <div className="border-t border-gray-200">
      {/* Comments list */}
      {loading ? (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto"></div>
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto">
          {comments.map(comment => (
            <div key={comment.id} className="p-4 border-b border-gray-100 last:border-b-0">
              <div className="flex items-start space-x-3">
                <Link to={`/${comment.username}`}>
                  <img
                    src={comment.avatar ? `http://localhost:3001/uploads/avatars/${comment.avatar}` : '/default-avatar.png'}
                    alt={comment.username}
                    className="avatar avatar-sm"
                  />
                </Link>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm">
                        <Link 
                          to={`/${comment.username}`}
                          className="font-semibold mr-2 hover:text-gray-500"
                        >
                          {comment.username}
                        </Link>
                        <span>{comment.content}</span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        <span>{formatTimeAgo(comment.createdAt)}</span>
                        <button className="hover:text-gray-600">Reply</button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button className="text-gray-400 hover:text-red-500">
                        <Heart className="w-3 h-3" />
                      </button>
                      
                      {comment.userId === user?.id && (
                        <div className="relative">
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <img
            src={user?.avatar ? `http://localhost:3001/uploads/avatars/${user.avatar}` : '/default-avatar.png'}
            alt={user?.username}
            className="avatar avatar-sm"
          />
          <div className="flex-1">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full bg-transparent text-sm placeholder-gray-500 border-none outline-none"
              disabled={submitting}
            />
          </div>
          {newComment.trim() && (
            <button
              type="submit"
              disabled={submitting}
              className="text-instagram-blue font-semibold text-sm hover:text-blue-800 disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CommentSection;