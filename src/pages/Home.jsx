import React, { useState, useEffect } from 'react';
import { postsAPI, followsAPI } from '../utils/api';
import PostCard from '../components/PostCard';
import StoriesSection from '../components/StoriesSection';
import SuggestionsSection from '../components/SuggestionsSection';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [postsResponse, suggestionsResponse] = await Promise.all([
        postsAPI.getFeed(1, 10),
        followsAPI.getSuggestions(5)
      ]);

      setPosts(postsResponse.data.posts);
      setSuggestions(suggestionsResponse.data.suggestions);
      setHasMore(postsResponse.data.posts.length === 10);
    } catch (error) {
      setError('Failed to load feed');
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const response = await postsAPI.getFeed(page + 1, 10);
      const newPosts = response.data.posts;
      
      setPosts(prev => [...prev, ...newPosts]);
      setPage(prev => prev + 1);
      setHasMore(newPosts.length === 10);
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => prev.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ));
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  const handleFollowUpdate = (userId, isFollowing) => {
    setSuggestions(prev => prev.filter(user => user.id !== userId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-instagram-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadInitialData}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-instagram-bg">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Main feed */}
          <div className="flex-1 max-w-2xl">
            {/* Stories section */}
            <StoriesSection />

            {/* Posts */}
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="card p-12 text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Welcome to Instagram!
                  </h3>
                  <p className="text-gray-500 mb-6">
                    When you follow people, you'll see the photos and videos they post here.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button className="btn-primary">
                      Find People
                    </button>
                    <button className="btn-secondary">
                      Create Post
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onUpdate={handlePostUpdate}
                      onDelete={handlePostDelete}
                    />
                  ))}

                  {/* Load more button */}
                  {hasMore && (
                    <div className="text-center py-6">
                      <button
                        onClick={loadMorePosts}
                        disabled={loadingMore}
                        className="btn-secondary"
                      >
                        {loadingMore ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                            Loading more...
                          </div>
                        ) : (
                          'Load more posts'
                        )}
                      </button>
                    </div>
                  )}

                  {!hasMore && posts.length > 0 && (
                    <div className="text-center py-6">
                      <p className="text-gray-500">You're all caught up!</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-80">
            <div className="sticky top-8 space-y-6">
              {/* Suggestions */}
              {suggestions.length > 0 && (
                <SuggestionsSection
                  suggestions={suggestions}
                  onFollowUpdate={handleFollowUpdate}
                />
              )}

              {/* Footer */}
              <div className="text-xs text-gray-400 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <a href="#" className="hover:underline">About</a>
                  <a href="#" className="hover:underline">Help</a>
                  <a href="#" className="hover:underline">Press</a>
                  <a href="#" className="hover:underline">API</a>
                  <a href="#" className="hover:underline">Jobs</a>
                  <a href="#" className="hover:underline">Privacy</a>
                  <a href="#" className="hover:underline">Terms</a>
                </div>
                <p>&copy; 2024 Instagram Clone</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;