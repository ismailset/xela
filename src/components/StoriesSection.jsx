import React from 'react';
import { Plus } from 'lucide-react';

const StoriesSection = () => {
  // Placeholder stories data
  const stories = [
    { id: 1, username: 'Your Story', avatar: '', hasStory: false, isOwn: true },
    { id: 2, username: 'john_doe', avatar: '', hasStory: true },
    { id: 3, username: 'jane_smith', avatar: '', hasStory: true },
    { id: 4, username: 'mike_wilson', avatar: '', hasStory: true },
    { id: 5, username: 'sarah_jones', avatar: '', hasStory: true },
  ];

  return (
    <div className="card p-4 mb-6">
      <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
        {stories.map((story) => (
          <div key={story.id} className="flex flex-col items-center min-w-[60px]">
            <div className={`relative ${story.hasStory && !story.isOwn ? 'story-ring' : ''}`}>
              <div className="relative">
                <img
                  src={story.avatar || '/default-avatar.png'}
                  alt={story.username}
                  className="avatar avatar-md"
                />
                {story.isOwn && (
                  <div className="absolute -bottom-1 -right-1 bg-instagram-blue rounded-full p-1">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-600 mt-2 text-center max-w-[60px] truncate">
              {story.isOwn ? 'Your Story' : story.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoriesSection;