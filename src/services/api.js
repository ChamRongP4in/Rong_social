import axios from 'axios';

const API_URL = 'https://rong-k-boy-zin.lovestoblog.com/backend/api';

export default {
  // ==========================================
  // AUTHENTICATION
  // ==========================================

  // FIXED: Action should be in query parameter, not body
  login: (username, password) =>
    axios.post(`${API_URL}/auth.php?action=login`, {
      username,
      password,
    }),

  register: (username, email, password, full_name) =>
    axios.post(`${API_URL}/auth.php?action=register`, {
      username,
      email,
      password,
      full_name,
    }),

  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  getUserById: (userId, currentUserId) =>
    axios.get(
      `${API_URL}/user.php?user_id=${userId}${currentUserId ? `&current_user_id=${currentUserId}` : ''}`,
    ),

  getUserByUsername: (username, currentUserId) =>
    axios.get(
      `${API_URL}/user.php?username=${username}${currentUserId ? `&current_user_id=${currentUserId}` : ''}`,
    ),

  getUserProfile: (username) =>
    axios.get(`${API_URL}/user.php?username=${username}`),

  updateProfile: (data) => axios.put(`${API_URL}/user.php`, data),

  // ==========================================
  // POSTS
  // ==========================================

  getPosts: (userId) =>
    axios.get(`${API_URL}/posts.php${userId ? `?user_id=${userId}` : ''}`),

  createPost: (data) => axios.post(`${API_URL}/posts.php`, data),

  deletePost: (postId, userId) =>
    axios.delete(`${API_URL}/posts.php`, {
      data: { post_id: postId, user_id: userId },
    }),

  updatePostCaption: (postId, userId, caption) =>
    axios.put(`${API_URL}/posts.php`, {
      post_id: postId,
      user_id: userId,
      caption: caption,
    }),

  // ==========================================
  // SAVED POSTS
  // ==========================================

  getSavedPosts: (userId) =>
    axios.get(`${API_URL}/saved_posts.php?user_id=${userId}`),

  savePost: (userId, postId) =>
    axios.post(`${API_URL}/saved_posts.php`, {
      user_id: userId,
      post_id: postId,
    }),

  unsavePost: (userId, postId) =>
    axios.delete(`${API_URL}/saved_posts.php`, {
      data: { user_id: userId, post_id: postId },
    }),

  getLikedPosts: (userId) =>
    axios.get(`${API_URL}/likes.php?user_id=${userId}`),

  // ==========================================
  // STORIES
  // ==========================================

  getStories: () => axios.get(`${API_URL}/stories.php`),

  createStory: (data) => axios.post(`${API_URL}/stories.php`, data),

  // ==========================================
  // LIKES
  // ==========================================

  likePost: (userId, postId) =>
    axios.post(`${API_URL}/likes.php`, { user_id: userId, post_id: postId }),

  unlikePost: (userId, postId) =>
    axios.delete(`${API_URL}/likes.php`, {
      data: { user_id: userId, post_id: postId },
    }),

  // ==========================================
  // COMMENTS
  // ==========================================

  getComments: (postId) =>
    axios.get(`${API_URL}/comments.php?post_id=${postId}`),

  createComment: (data) => axios.post(`${API_URL}/comments.php`, data),

  deleteComment: (commentId, userId) =>
    axios.delete(`${API_URL}/comments.php`, {
      data: { comment_id: commentId, user_id: userId },
    }),

  // ==========================================
  // FILE UPLOAD
  // ==========================================

  uploadFile: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log(
        'Uploading file:',
        file.name,
        'Size:',
        file.size,
        'Type:',
        file.type,
      );

      const response = await axios.post(`${API_URL}/upload.php`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          console.log('Upload progress:', percentCompleted + '%');
        },
      });

      console.log('Upload response:', response.data);
      return response;
    } catch (error) {
      console.error('Upload error:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // FOLLOW SYSTEM
  // ==========================================

  followUser: (followerId, followingId) =>
    axios.post(`${API_URL}/follow.php`, {
      follower_id: followerId,
      following_id: followingId,
    }),

  unfollowUser: (followerId, followingId) =>
    axios.delete(`${API_URL}/follow.php`, {
      data: { follower_id: followerId, following_id: followingId },
    }),

  getFollowers: (userId, currentUserId) =>
    axios.get(
      `${API_URL}/follow.php?user_id=${userId}&type=followers${currentUserId ? `&current_user_id=${currentUserId}` : ''}`,
    ),

  getFollowing: (userId, currentUserId) =>
    axios.get(
      `${API_URL}/follow.php?user_id=${userId}&type=following${currentUserId ? `&current_user_id=${currentUserId}` : ''}`,
    ),

  // ==========================================
  // SEARCH
  // ==========================================

  searchUsers: (query, currentUserId) =>
    axios.get(
      `${API_URL}/search.php?q=${encodeURIComponent(query)}${currentUserId ? `&current_user_id=${currentUserId}` : ''}`,
    ),

  // ==========================================
  // CHAT SYSTEM
  // ==========================================

  getConversations: (userId) =>
    axios.get(`${API_URL}/conversations.php?user_id=${userId}`),

  createConversation: (user1Id, user2Id) =>
    axios.post(`${API_URL}/conversations.php`, {
      user1_id: user1Id,
      user2_id: user2Id,
    }),

  getMessages: (conversationId) =>
    axios.get(`${API_URL}/messages.php?conversation_id=${conversationId}`),

  sendMessage: (conversationId, senderId, receiverId, message) =>
    axios.post(`${API_URL}/messages.php`, {
      conversation_id: conversationId,
      sender_id: senderId,
      receiver_id: receiverId,
      message: message,
    }),

  markMessagesAsRead: (conversationId, userId) =>
    axios.put(`${API_URL}/messages.php`, {
      conversation_id: conversationId,
      user_id: userId,
    }),
};
