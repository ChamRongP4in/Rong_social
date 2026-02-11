import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Home, User, MessageCircle, LogOut, Heart, Bookmark, Grid, Search, PlusSquare, Settings, UserPlus, UserCheck, Edit2, X, Trash2, Camera } from 'lucide-react'
import api from '../services/api'
import { formatTimeAgo } from '../utils/timeUtils'
import CommentsModal from '../components/CommentsModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import EditCaptionModal from '../components/EditCaptionModal'
import Footer from '../components/Footer'

// Simple inline hook to avoid import issues
function useUnreadCount(currentUser) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        if (currentUser?.id) {
            // You can implement the actual API call here later
            setCount(0)
        }
    }, [currentUser?.id])
    return count
}

function Profile({ currentUser, onLogout }) {
    const { username } = useParams()
    const navigate = useNavigate()
    const unreadCount = useUnreadCount(currentUser)

    const [user, setUser] = useState(null)
    const [posts, setPosts] = useState([])
    const [savedPosts, setSavedPosts] = useState([])
    const [likedPosts, setLikedPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [isFollowing, setIsFollowing] = useState(false)
    const [activeTab, setActiveTab] = useState('posts')
    const [fullPostModal, setFullPostModal] = useState(null)
    const [commentsModal, setCommentsModal] = useState(null)
    const [deleteModal, setDeleteModal] = useState(null)
    const [editCaptionModal, setEditCaptionModal] = useState(null)
    const [showEditProfile, setShowEditProfile] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [showChangeProfilePicture, setShowChangeProfilePicture] = useState(false)
    const [selectedProfilePic, setSelectedProfilePic] = useState(null)
    const [profilePicPreview, setProfilePicPreview] = useState(null)
    const [uploadingProfilePic, setUploadingProfilePic] = useState(false)
    const [showFollowersModal, setShowFollowersModal] = useState(null) // 'followers' or 'following'
    const [followersList, setFollowersList] = useState([])
    const [followingList, setFollowingList] = useState([])
    const [loadingFollowers, setLoadingFollowers] = useState(false)
    const [editData, setEditData] = useState({
        full_name: '',
        bio: ''
    })

    useEffect(() => {
        if (currentUser && username) {
            loadUserProfile()
        } else if (!currentUser) {
            // If no currentUser, stop loading state
            setLoading(false)
        }
    }, [username, currentUser])

    useEffect(() => {
        if (currentUser && user && String(currentUser.id) === String(user.id)) {
            loadSavedPosts()
            loadLikedPosts()
        }
    }, [user, currentUser])

    const loadUserProfile = async () => {
        if (!currentUser || !username) {
            setLoading(false)
            return
        }

        try {
            const response = await api.getUserByUsername(username, currentUser.id)

            if (!response.data || !response.data.user) {
                setLoading(false)
                return
            }

            const userData = response.data.user
            setUser(userData)
            setIsFollowing(response.data.is_following || false)

            const postsResponse = await api.getPosts(userData.id)
            setPosts(postsResponse.data.posts || [])

            if (currentUser) {
                setEditData({
                    full_name: userData.full_name || '',
                    bio: userData.bio || ''
                })
            }
        } catch (err) {
            console.error('Failed to load profile:', err)
        } finally {
            setLoading(false)
        }
    }

    const loadSavedPosts = async () => {
        if (!currentUser?.id) return
        try {
            const response = await api.getSavedPosts(currentUser.id)
            setSavedPosts(response.data.posts || [])
        } catch (err) {
            console.error('Failed to load saved posts:', err)
        }
    }

    const loadLikedPosts = async () => {
        if (!currentUser?.id) return
        try {
            const response = await api.getLikedPosts(currentUser.id)
            setLikedPosts(response.data.posts || [])
        } catch (err) {
            console.error('Failed to load liked posts:', err)
        }
    }

    const loadFollowersList = async (type) => {
        setLoadingFollowers(true)
        try {
            const currentUserId = currentUser?.id || null
            if (type === 'followers') {
                const response = await api.getFollowers(user.id, currentUserId)
                setFollowersList(response.data.followers || [])
            } else {
                const response = await api.getFollowing(user.id, currentUserId)
                setFollowingList(response.data.following || [])
            }
        } catch (err) {
            console.error(`Failed to load ${type}:`, err)
            // Set empty array on error
            if (type === 'followers') {
                setFollowersList([])
            } else {
                setFollowingList([])
            }
        } finally {
            setLoadingFollowers(false)
        }
    }

    const handleFollowFromList = async (userId, isCurrentlyFollowing) => {
        try {
            if (isCurrentlyFollowing) {
                await api.unfollowUser(currentUser.id, userId)
            } else {
                await api.followUser(currentUser.id, userId)
            }
            // Reload the lists to update follow states
            if (showFollowersModal === 'followers') {
                loadFollowersList('followers')
            } else {
                loadFollowersList('following')
            }
            // Also reload profile to update counts
            loadUserProfile()
        } catch (err) {
            console.error('Failed to toggle follow:', err)
        }
    }

    const handleFollow = async () => {
        if (!currentUser?.id || !user?.id) {
            console.error('User not authenticated')
            return
        }

        try {
            if (isFollowing) {
                await api.unfollowUser(currentUser.id, user.id)
                setIsFollowing(false)
                // Update follower count locally
                setUser(prev => ({
                    ...prev,
                    followers_count: (prev.followers_count || 0) - 1
                }))
            } else {
                await api.followUser(currentUser.id, user.id)
                setIsFollowing(true)
                // Update follower count locally
                setUser(prev => ({
                    ...prev,
                    followers_count: (prev.followers_count || 0) + 1
                }))
            }
        } catch (err) {
            console.error('Failed to toggle follow:', err)
        }
    }

    const handleMessageUser = async () => {
        if (!currentUser?.id || !user?.id) {
            console.error('User not authenticated')
            return
        }

        try {
            await api.createConversation(currentUser.id, user.id)
            navigate('/messages', {
                state: {
                    selectedUserId: user.id,
                    selectedUsername: user.username
                }
            })
        } catch (err) {
            console.error('Failed to start conversation:', err)
        }
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        if (!currentUser?.id) {
            console.error('User not authenticated')
            return
        }

        try {
            await api.updateProfile({
                user_id: currentUser.id,
                full_name: editData.full_name,
                bio: editData.bio
            })
            setShowEditProfile(false)
            loadUserProfile()
        } catch (err) {
            console.error('Failed to update profile:', err)
            alert('Failed to update profile')
        }
    }

    const handleProfilePicSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file')
                return
            }
            if (file.size > 10 * 1024 * 1024) {
                alert('Image size must be less than 10MB')
                return
            }
            setSelectedProfilePic(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfilePicPreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleUploadProfilePicture = async () => {
        if (!selectedProfilePic) return

        setUploadingProfilePic(true)
        try {
            // Upload the file
            const uploadResponse = await api.uploadFile(selectedProfilePic)
            if (!uploadResponse.data.success) {
                throw new Error('Upload failed')
            }

            const profilePictureUrl = uploadResponse.data.url

            // Update profile with new picture
            await api.updateProfile({
                user_id: currentUser.id,
                profile_picture: profilePictureUrl
            })

            // Update localStorage
            const updatedUser = {
                ...currentUser,
                profile_picture: profilePictureUrl
            }
            localStorage.setItem('user', JSON.stringify(updatedUser))

            // Close modal and reload profile
            setShowChangeProfilePicture(false)
            setSelectedProfilePic(null)
            setProfilePicPreview(null)
            loadUserProfile()
        } catch (err) {
            console.error('Failed to upload profile picture:', err)
            alert('Failed to upload profile picture')
        } finally {
            setUploadingProfilePic(false)
        }
    }

    const handleLike = async (postId, isLiked) => {
        if (!currentUser?.id) return

        try {
            if (isLiked) {
                await api.unlikePost(postId, currentUser.id)
            } else {
                await api.likePost(postId, currentUser.id)
            }

            // Update the post in the lists
            const updatePosts = (posts) => posts.map(p => {
                if (p.id === postId) {
                    return {
                        ...p,
                        is_liked: isLiked ? 0 : 1,
                        likes_count: isLiked ? (p.likes_count - 1) : (p.likes_count + 1)
                    }
                }
                return p
            })

            setPosts(updatePosts)
            setSavedPosts(updatePosts)
            setLikedPosts(updatePosts)

            // Update fullPostModal if open
            if (fullPostModal && fullPostModal.id === postId) {
                setFullPostModal({
                    ...fullPostModal,
                    is_liked: isLiked ? 0 : 1,
                    likes_count: isLiked ? (fullPostModal.likes_count - 1) : (fullPostModal.likes_count + 1)
                })
            }
        } catch (err) {
            console.error('Failed to toggle like:', err)
        }
    }

    const handleSave = async (postId, isSaved) => {
        if (!currentUser?.id) return

        try {
            if (isSaved) {
                await api.unsavePost(postId, currentUser.id)
            } else {
                await api.savePost(postId, currentUser.id)
            }

            // Update the post in the lists
            const updatePosts = (posts) => posts.map(p => {
                if (p.id === postId) {
                    return { ...p, is_saved: isSaved ? 0 : 1 }
                }
                return p
            })

            setPosts(updatePosts)
            setSavedPosts(updatePosts)
            setLikedPosts(updatePosts)

            // Update fullPostModal if open
            if (fullPostModal && fullPostModal.id === postId) {
                setFullPostModal({
                    ...fullPostModal,
                    is_saved: isSaved ? 0 : 1
                })
            }

            // Reload saved posts if we're on that tab
            if (activeTab === 'saved') {
                loadSavedPosts()
            }
        } catch (err) {
            console.error('Failed to toggle save:', err)
        }
    }

    const handleDeletePost = async (postId) => {
        if (!currentUser?.id) {
            console.error('User not authenticated')
            return
        }

        try {
            await api.deletePost(postId, currentUser.id)
            setDeleteModal(null)
            setFullPostModal(null)
            loadUserProfile()
            if (currentUser && user && currentUser.id === user.id) {
                loadSavedPosts()
                loadLikedPosts()
            }
        } catch (err) {
            console.error('Failed to delete post:', err)
            alert('Failed to delete post')
        }
    }

    const openFullPost = (post) => {
        setFullPostModal(post)
    }

    const getCurrentPosts = () => {
        switch (activeTab) {
            case 'saved':
                return savedPosts
            case 'liked':
                return likedPosts
            default:
                return posts
        }
    }

    const getEmptyMessage = () => {
        switch (activeTab) {
            case 'saved':
                return {
                    icon: <Bookmark size={64} style={{ color: 'var(--pink-300)' }} />,
                    title: 'No saved posts yet',
                    message: 'Bookmark posts you like to save them here! 💗'
                }
            case 'liked':
                return {
                    icon: <Heart size={64} style={{ color: 'var(--pink-300)' }} />,
                    title: 'No liked posts yet',
                    message: 'Posts you like will appear here! ❤️'
                }
            default:
                return {
                    icon: <Grid size={64} style={{ color: 'var(--pink-300)' }} />,
                    title: 'No posts yet',
                    message: user?.id === currentUser?.id ? 'Start creating your first post! 📸' : `${user?.username} hasn't posted yet`
                }
        }
    }

    // Check if currentUser is available
    if (!currentUser) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="spinner"></div>
            </div>
        )
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="spinner"></div>
            </div>
        )
    }

    if (!user) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>User not found</p>
            </div>
        )
    }

    const currentPosts = getCurrentPosts()
    const emptyState = getEmptyMessage()
    const isOwnProfile = currentUser && user && String(currentUser.id) === String(user.id)

    return (
        <div className="app-container">
            <nav className="sidebar">
                <h1 className="logo">Pinktagram</h1>
                <Link to="/" className="nav-item">
                    <Home size={24} />
                    <span>Home</span>
                </Link>
                <Link to="/search" className="nav-item">
                    <Search size={24} />
                    <span>Search</span>
                </Link>
                <Link to="/messages" className="nav-item" style={{ position: 'relative' }}>
                    <MessageCircle size={24} />
                    <span>Messages</span>
                </Link>
                <Link to={`/profile/${currentUser.username}`} className="nav-item active">
                    <User size={24} />
                    <span>Profile</span>
                </Link>
            </nav>

            <main className="main-content" style={{ paddingBottom: '80px' }}>
                {/* Profile Header */}
                <div style={{
                    background: 'linear-gradient(135deg, var(--pink-50) 0%, white 100%)',
                    borderRadius: '30px',
                    padding: '40px',
                    marginBottom: '30px',
                    boxShadow: '0 8px 25px rgba(240, 51, 122, 0.1)'
                }}>
                    <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }} className="profile-header-responsive">
                        <div className="profile-picture-container" style={{ textAlign: 'center' }}>
                            <img
                                src={user.profile_picture || 'https://via.placeholder.com/150'}
                                alt={user.username}
                                style={{
                                    width: '150px',
                                    height: '150px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '4px solid var(--pink-300)',
                                    boxShadow: '0 4px 15px rgba(240, 51, 122, 0.2)'
                                }}
                            />
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }} className="profile-header-actions">
                                <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--pink-600)' }} className="profile-username">
                                    {user.username}
                                </h2>
                                {isOwnProfile ? (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => setShowEditProfile(true)}
                                            className="btn"
                                            style={{
                                                background: 'var(--pink-100)',
                                                color: 'var(--pink-600)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <Edit2 size={18} />
                                            Edit Profile
                                        </button>
                                        <button
                                            onClick={() => setShowSettings(true)}
                                            className="btn"
                                            style={{
                                                background: 'var(--pink-100)',
                                                color: 'var(--pink-600)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <Settings size={18} />
                                            Settings
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleFollow}
                                            className="btn"
                                            style={{
                                                background: isFollowing ? 'var(--pink-100)' : 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-600) 100%)',
                                                color: isFollowing ? 'var(--pink-600)' : 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                border: 'none',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            {isFollowing ? (
                                                <>
                                                    <UserCheck size={18} />
                                                    Following
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus size={18} />
                                                    Follow
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={handleMessageUser}
                                            className="btn"
                                            style={{
                                                background: 'var(--pink-100)',
                                                color: 'var(--pink-600)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <MessageCircle size={18} />
                                            Message
                                        </button>
                                    </>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '30px', marginBottom: '20px' }}>
                                <div>
                                    <strong style={{ fontSize: '18px', color: 'var(--pink-600)' }}>{posts.length}</strong>
                                    <span style={{ marginLeft: '5px', color: 'var(--text-secondary)' }}>posts</span>
                                </div>
                                <div
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setShowFollowersModal('followers')
                                        loadFollowersList('followers')
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <strong style={{ fontSize: '18px', color: 'var(--pink-600)' }}>{user.followers_count || 0}</strong>
                                    <span style={{ marginLeft: '5px', color: 'var(--text-secondary)' }}>followers</span>
                                </div>
                                <div
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setShowFollowersModal('following')
                                        loadFollowersList('following')
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <strong style={{ fontSize: '18px', color: 'var(--pink-600)' }}>{user.following_count || 0}</strong>
                                    <span style={{ marginLeft: '5px', color: 'var(--text-secondary)' }}>following</span>
                                </div>
                            </div>

                            <div>
                                <p style={{ fontWeight: 600, marginBottom: '5px' }}>{user.full_name}</p>
                                {user.bio && <p style={{ color: 'var(--text-secondary)', marginBottom: '5px' }}>{user.bio}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                {isOwnProfile && (
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '20px',
                        borderBottom: '2px solid var(--pink-100)',
                        background: 'white',
                        borderRadius: '20px 20px 0 0',
                        overflow: 'hidden'
                    }}>
                        <button
                            onClick={() => setActiveTab('posts')}
                            style={{
                                flex: 1,
                                background: activeTab === 'posts' ? 'var(--pink-50)' : 'transparent',
                                border: 'none',
                                padding: '15px 20px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: 600,
                                color: activeTab === 'posts' ? 'var(--pink-600)' : 'var(--text-secondary)',
                                borderBottom: activeTab === 'posts' ? '3px solid var(--pink-600)' : '3px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Grid size={18} />
                            Posts ({posts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('saved')}
                            style={{
                                flex: 1,
                                background: activeTab === 'saved' ? 'var(--pink-50)' : 'transparent',
                                border: 'none',
                                padding: '15px 20px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: 600,
                                color: activeTab === 'saved' ? 'var(--pink-600)' : 'var(--text-secondary)',
                                borderBottom: activeTab === 'saved' ? '3px solid var(--pink-600)' : '3px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Bookmark size={18} fill={activeTab === 'saved' ? 'var(--pink-600)' : 'none'} />
                            Saved ({savedPosts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('liked')}
                            style={{
                                flex: 1,
                                background: activeTab === 'liked' ? 'var(--pink-50)' : 'transparent',
                                border: 'none',
                                padding: '15px 20px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: 600,
                                color: activeTab === 'liked' ? 'var(--pink-600)' : 'var(--text-secondary)',
                                borderBottom: activeTab === 'liked' ? '3px solid var(--pink-600)' : '3px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Heart size={18} fill={activeTab === 'liked' ? 'var(--pink-600)' : 'none'} />
                            Liked ({likedPosts.length})
                        </button>
                    </div>
                )}

                {/* Posts Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px'
                }}>
                    {currentPosts.length === 0 ? (
                        <div style={{
                            gridColumn: '1 / -1',
                            textAlign: 'center',
                            padding: '60px 20px',
                            background: 'var(--pink-50)',
                            borderRadius: '25px',
                            border: '2px dashed var(--pink-200)'
                        }}>
                            {emptyState.icon}
                            <p style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600, marginTop: '20px' }}>
                                {emptyState.title}
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '10px' }}>
                                {emptyState.message}
                            </p>
                        </div>
                    ) : (
                        currentPosts.map((post) => (
                            <div
                                key={post.id}
                                onClick={() => openFullPost(post)}
                                style={{
                                    position: 'relative',
                                    cursor: 'pointer',
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    aspectRatio: '1',
                                    background: 'black'
                                }}
                            >
                                {post.media_type === 'video' ? (
                                    <video src={post.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <img src={post.media_url} alt="Post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'rgba(0, 0, 0, 0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '20px',
                                        opacity: 0,
                                        transition: 'opacity 0.3s ease'
                                    }}
                                    className="post-overlay"
                                >
                                    <span style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Heart size={20} fill="white" />
                                        {post.likes_count || 0}
                                    </span>
                                    <span style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <MessageCircle size={20} fill="white" />
                                        {post.comments_count || 0}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <Footer />
            </main>

            {/* Full Post Modal */}
            {fullPostModal && (
                <div className="modal-overlay" onClick={() => setFullPostModal(null)} style={{ zIndex: 10000 }}>
                    <div className="modal modal-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', padding: 0, overflow: 'hidden', width: '95%', maxHeight: '90vh' }}>
                        <div className="modal-header" style={{ padding: '20px 30px' }}>
                            <h2 className="modal-title">📸 Post</h2>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {fullPostModal.user_id === currentUser.id && activeTab === 'posts' && (
                                    <>
                                        <button onClick={() => setEditCaptionModal(fullPostModal)} style={{ background: 'var(--pink-100)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--pink-600)' }}>
                                            <Edit2 size={20} />
                                        </button>
                                        <button onClick={() => setDeleteModal(fullPostModal)} style={{ background: 'var(--pink-100)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--pink-600)' }}>
                                            <Trash2 size={20} />
                                        </button>
                                    </>
                                )}
                                <button className="modal-close" onClick={() => setFullPostModal(null)}>
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', maxHeight: '80vh' }}>
                            <div style={{ flex: 1, background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {fullPostModal.media_type === 'video' ? (
                                    <video src={fullPostModal.media_url} controls autoPlay style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
                                ) : (
                                    <img src={fullPostModal.media_url} alt="Post" style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
                                )}
                            </div>

                            <div style={{ width: window.innerWidth < 768 ? '100%' : '400px', display: 'flex', flexDirection: 'column', background: 'white', overflowY: 'auto' }}>
                                <div style={{ padding: '20px', borderBottom: '1px solid var(--pink-100)' }}>
                                    <p style={{ fontWeight: 600, color: 'var(--pink-600)' }}>{fullPostModal.username}</p>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatTimeAgo(fullPostModal.created_at)}</p>
                                </div>

                                {fullPostModal.caption && (
                                    <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--pink-100)' }}>
                                        <p style={{ fontSize: '14px' }}><strong>{fullPostModal.username}</strong> {fullPostModal.caption}</p>
                                    </div>
                                )}

                                <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--pink-100)' }}>
                                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{fullPostModal.likes_count || 0} likes</p>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px' }}>{fullPostModal.comments_count || 0} comments</p>
                                </div>

                                {/* Action Buttons */}
                                <div style={{
                                    padding: '15px 20px',
                                    borderBottom: '1px solid var(--pink-100)',
                                    display: 'flex',
                                    gap: '20px',
                                    alignItems: 'center'
                                }}>
                                    <button
                                        onClick={() => handleLike(fullPostModal.id, fullPostModal.is_liked > 0)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 12px',
                                            borderRadius: '10px',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--pink-50)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                    >
                                        <Heart
                                            size={24}
                                            fill={fullPostModal.is_liked > 0 ? 'var(--pink-500)' : 'none'}
                                            color={fullPostModal.is_liked > 0 ? 'var(--pink-500)' : 'var(--text-primary)'}
                                        />
                                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Like</span>
                                    </button>

                                    <button
                                        onClick={() => { setCommentsModal(fullPostModal); setFullPostModal(null) }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 12px',
                                            borderRadius: '10px',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--pink-50)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                    >
                                        <MessageCircle size={24} color="var(--text-primary)" />
                                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Comment</span>
                                    </button>

                                    <button
                                        onClick={() => handleSave(fullPostModal.id, fullPostModal.is_saved > 0)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 12px',
                                            borderRadius: '10px',
                                            transition: 'all 0.3s ease',
                                            marginLeft: 'auto'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--pink-50)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                    >
                                        <Bookmark
                                            size={24}
                                            fill={fullPostModal.is_saved > 0 ? 'var(--pink-500)' : 'none'}
                                            color={fullPostModal.is_saved > 0 ? 'var(--pink-500)' : 'var(--text-primary)'}
                                        />
                                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Save</span>
                                    </button>
                                </div>

                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                    <button onClick={() => { setCommentsModal(fullPostModal); setFullPostModal(null) }} className="btn btn-primary" style={{ width: '100%' }}>
                                        💬 View All Comments
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {showEditProfile && (
                <div className="modal-overlay" onClick={() => setShowEditProfile(false)}>
                    <div className="modal modal-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">✏️ Edit Profile</h2>
                            <button className="modal-close" onClick={() => setShowEditProfile(false)}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleUpdateProfile} style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Full Name</label>
                                <input type="text" value={editData.full_name} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid var(--pink-200)', borderRadius: '10px', fontSize: '15px', fontFamily: 'Quicksand, sans-serif' }} />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Bio</label>
                                <textarea value={editData.bio} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} style={{ width: '100%', minHeight: '80px', padding: '12px', border: '2px solid var(--pink-200)', borderRadius: '10px', fontSize: '15px', fontFamily: 'Quicksand, sans-serif', resize: 'vertical' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => setShowEditProfile(false)} className="btn" style={{ flex: 1, background: 'var(--pink-100)', color: 'var(--text-primary)' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>💾 Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modals */}
            {commentsModal && <CommentsModal post={commentsModal} currentUser={currentUser} onClose={() => setCommentsModal(null)} onUpdate={() => { setCommentsModal(null); loadUserProfile() }} />}
            {deleteModal && <DeleteConfirmModal title="Delete Post" message="Are you sure you want to delete this post? This action cannot be undone." onConfirm={() => handleDeletePost(deleteModal.id)} onCancel={() => setDeleteModal(null)} />}
            {editCaptionModal && <EditCaptionModal post={editCaptionModal} onClose={() => setEditCaptionModal(null)} onUpdate={() => { setEditCaptionModal(null); loadUserProfile(); loadSavedPosts(); loadLikedPosts() }} />}

            {/* Followers/Following Modal */}
            {showFollowersModal && (
                <div className="modal-overlay" onClick={() => setShowFollowersModal(null)}>
                    <div className="modal modal-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', borderRadius: '30px', maxHeight: '80vh' }}>
                        <div className="modal-header" style={{
                            background: 'linear-gradient(135deg, var(--pink-50) 0%, white 100%)',
                            borderBottom: '2px solid var(--pink-100)',
                            padding: '25px 30px'
                        }}>
                            <h2 className="modal-title" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-600) 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: '22px'
                            }}>
                                {showFollowersModal === 'followers' ? '👥 Followers' : '👤 Following'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowFollowersModal(null)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
                            {loadingFollowers ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                                </div>
                            ) : (
                                <>
                                    {showFollowersModal === 'followers' && followersList.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                                            <User size={48} style={{ color: 'var(--pink-300)', margin: '0 auto 15px' }} />
                                            <p style={{ fontSize: '16px' }}>No followers yet</p>
                                        </div>
                                    )}

                                    {showFollowersModal === 'following' && followingList.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                                            <User size={48} style={{ color: 'var(--pink-300)', margin: '0 auto 15px' }} />
                                            <p style={{ fontSize: '16px' }}>Not following anyone yet</p>
                                        </div>
                                    )}

                                    {showFollowersModal === 'followers' && followersList.map((follower) => (
                                        <div
                                            key={follower.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '15px',
                                                padding: '12px 15px',
                                                borderRadius: '15px',
                                                marginBottom: '10px',
                                                background: 'white',
                                                border: '2px solid var(--pink-100)',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--pink-50)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                        >
                                            <img
                                                src={follower.profile_picture || 'https://via.placeholder.com/50'}
                                                alt={follower.username}
                                                onClick={() => {
                                                    navigate(`/profile/${follower.username}`)
                                                    setShowFollowersModal(null)
                                                }}
                                                style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    border: '3px solid var(--pink-300)',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                            <div
                                                style={{ flex: 1, cursor: 'pointer' }}
                                                onClick={() => {
                                                    navigate(`/profile/${follower.username}`)
                                                    setShowFollowersModal(null)
                                                }}
                                            >
                                                <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--pink-600)' }}>
                                                    {follower.username}
                                                </p>
                                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                    {follower.full_name || 'User'}
                                                </p>
                                            </div>
                                            {String(follower.id) !== String(currentUser.id) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleFollowFromList(follower.id, follower.is_following > 0)
                                                    }}
                                                    className="btn"
                                                    style={{
                                                        background: follower.is_following > 0 ? 'var(--pink-100)' : 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-600) 100%)',
                                                        color: follower.is_following > 0 ? 'var(--pink-600)' : 'white',
                                                        padding: '8px 20px',
                                                        fontSize: '14px',
                                                        border: 'none',
                                                        minWidth: '100px'
                                                    }}
                                                >
                                                    {follower.is_following > 0 ? 'Following' : 'Follow'}
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {showFollowersModal === 'following' && followingList.map((following) => (
                                        <div
                                            key={following.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '15px',
                                                padding: '12px 15px',
                                                borderRadius: '15px',
                                                marginBottom: '10px',
                                                background: 'white',
                                                border: '2px solid var(--pink-100)',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--pink-50)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                        >
                                            <img
                                                src={following.profile_picture || 'https://via.placeholder.com/50'}
                                                alt={following.username}
                                                onClick={() => {
                                                    navigate(`/profile/${following.username}`)
                                                    setShowFollowersModal(null)
                                                }}
                                                style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    border: '3px solid var(--pink-300)',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                            <div
                                                style={{ flex: 1, cursor: 'pointer' }}
                                                onClick={() => {
                                                    navigate(`/profile/${following.username}`)
                                                    setShowFollowersModal(null)
                                                }}
                                            >
                                                <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--pink-600)' }}>
                                                    {following.username}
                                                </p>
                                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                    {following.full_name || 'User'}
                                                </p>
                                            </div>
                                            {String(following.id) !== String(currentUser.id) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleFollowFromList(following.id, following.is_following > 0)
                                                    }}
                                                    className="btn"
                                                    style={{
                                                        background: following.is_following > 0 ? 'var(--pink-100)' : 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-600) 100%)',
                                                        color: following.is_following > 0 ? 'var(--pink-600)' : 'white',
                                                        padding: '8px 20px',
                                                        fontSize: '14px',
                                                        border: 'none',
                                                        minWidth: '100px'
                                                    }}
                                                >
                                                    {following.is_following > 0 ? 'Following' : 'Follow'}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="modal-overlay" onClick={() => setShowSettings(false)}>
                    <div className="modal modal-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', borderRadius: '30px' }}>
                        <div className="modal-header" style={{
                            background: 'linear-gradient(135deg, var(--pink-50) 0%, white 100%)',
                            borderBottom: '2px solid var(--pink-100)',
                            padding: '25px 30px'
                        }}>
                            <h2 className="modal-title" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-600) 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: '22px'
                            }}>
                                <Settings size={24} style={{ color: 'var(--pink-600)' }} />
                                ⚙️ Settings
                            </h2>
                            <button className="modal-close" onClick={() => setShowSettings(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: '20px 30px' }}>
                            {/* Account Section */}
                            <div style={{ marginBottom: '25px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Account
                                </h3>

                                {/* Change Profile Picture */}
                                <button
                                    onClick={() => {
                                        setShowSettings(false)
                                        setShowChangeProfilePicture(true)
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '15px 20px',
                                        background: 'white',
                                        border: '2px solid var(--pink-100)',
                                        borderRadius: '15px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px',
                                        cursor: 'pointer',
                                        marginBottom: '10px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--pink-50)'
                                        e.currentTarget.style.borderColor = 'var(--pink-300)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'white'
                                        e.currentTarget.style.borderColor = 'var(--pink-100)'
                                    }}
                                >
                                    <User size={20} style={{ color: 'var(--pink-600)' }} />
                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                        <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '2px' }}>Change Profile Picture</p>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Upload a new profile photo</p>
                                    </div>
                                </button>

                                {/* Edit Profile */}
                                <button
                                    onClick={() => {
                                        setShowSettings(false)
                                        setShowEditProfile(true)
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '15px 20px',
                                        background: 'white',
                                        border: '2px solid var(--pink-100)',
                                        borderRadius: '15px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px',
                                        cursor: 'pointer',
                                        marginBottom: '10px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--pink-50)'
                                        e.currentTarget.style.borderColor = 'var(--pink-300)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'white'
                                        e.currentTarget.style.borderColor = 'var(--pink-100)'
                                    }}
                                >
                                    <Edit2 size={20} style={{ color: 'var(--pink-600)' }} />
                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                        <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '2px' }}>Edit Profile</p>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Change your name and bio</p>
                                    </div>
                                </button>
                            </div>

                            {/* Preferences Section */}
                            <div style={{ marginBottom: '25px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Preferences
                                </h3>
                                <div style={{
                                    padding: '15px 20px',
                                    background: 'var(--pink-50)',
                                    border: '2px solid var(--pink-100)',
                                    borderRadius: '15px',
                                    marginBottom: '10px',
                                    opacity: 0.6
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ fontSize: '20px' }}>🌙</div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '2px' }}>Theme</p>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Coming soon!</p>
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    padding: '15px 20px',
                                    background: 'var(--pink-50)',
                                    border: '2px solid var(--pink-100)',
                                    borderRadius: '15px',
                                    opacity: 0.6
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ fontSize: '20px' }}>🔒</div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '2px' }}>Privacy</p>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Coming soon!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Logout Section */}
                            <button
                                onClick={onLogout}
                                style={{
                                    width: '100%',
                                    padding: '15px 20px',
                                    background: 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-600) 100%)',
                                    border: 'none',
                                    borderRadius: '15px',
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    transition: 'transform 0.2s ease',
                                    boxShadow: '0 4px 15px rgba(240, 51, 122, 0.3)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <LogOut size={20} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Profile Picture Modal */}
            {showChangeProfilePicture && (
                <div className="modal-overlay" onClick={() => setShowChangeProfilePicture(false)}>
                    <div className="modal modal-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', borderRadius: '30px' }}>
                        <div className="modal-header" style={{
                            background: 'linear-gradient(135deg, var(--pink-50) 0%, white 100%)',
                            borderBottom: '2px solid var(--pink-100)',
                            padding: '25px 30px'
                        }}>
                            <h2 className="modal-title" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-600) 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: '22px'
                            }}>
                                <Camera size={24} style={{ color: 'var(--pink-600)' }} />
                                📸 Change Profile Picture
                            </h2>
                            <button className="modal-close" onClick={() => setShowChangeProfilePicture(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: '30px', textAlign: 'center' }}>
                            <div style={{ marginBottom: '25px' }}>
                                <img
                                    src={profilePicPreview || user.profile_picture || 'https://via.placeholder.com/150'}
                                    alt="Profile Preview"
                                    style={{
                                        width: '150px',
                                        height: '150px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '4px solid var(--pink-300)',
                                        boxShadow: '0 4px 15px rgba(240, 51, 122, 0.3)',
                                        margin: '0 auto'
                                    }}
                                />
                            </div>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePicSelect}
                                style={{ display: 'none' }}
                                id="profile-pic-upload"
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label
                                    htmlFor="profile-pic-upload"
                                    className="btn"
                                    style={{
                                        background: 'var(--pink-100)',
                                        color: 'var(--pink-600)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Camera size={20} />
                                    Choose Photo
                                </label>

                                {selectedProfilePic && (
                                    <button
                                        onClick={handleUploadProfilePicture}
                                        className="btn btn-primary"
                                        disabled={uploadingProfilePic}
                                        style={{ width: '100%' }}
                                    >
                                        {uploadingProfilePic ? '⏳ Uploading...' : '💾 Save New Picture'}
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        setShowChangeProfilePicture(false)
                                        setSelectedProfilePic(null)
                                        setProfilePicPreview(null)
                                    }}
                                    className="btn"
                                    style={{
                                        background: 'var(--pink-100)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals - continued */}
            <div className="mobile-bottom-nav" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '2px solid var(--pink-100)', padding: '10px 0', zIndex: 1000 }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', maxWidth: '500px', margin: '0 auto' }}>
                    <Link to="/" style={{ padding: '10px' }}><Home size={28} color="var(--text-secondary)" /></Link>
                    <Link to="/search" style={{ padding: '10px' }}><Search size={28} color="var(--text-secondary)" /></Link>
                    <Link to="/messages" style={{ padding: '10px', position: 'relative' }}>
                        <MessageCircle size={28} color="var(--text-secondary)" />
                    </Link>
                    <Link to={`/profile/${currentUser.username}`} style={{ padding: '10px' }}><User size={28} color="var(--pink-600)" /></Link>
                </div>
            </div>

            <style>{`
                .post-overlay:hover { opacity: 1 !important; }
                .profile-header-responsive { display: flex; gap: 40px; align-items: flex-start; }
                @media (max-width: 768px) {
                    .mobile-bottom-nav { display: block !important; }
                    .sidebar { display: none !important; }
                    .profile-header-responsive { 
                        flex-direction: column; 
                        align-items: center; 
                        text-align: center; 
                    }
                    .profile-header-actions {
                        justify-content: center !important;
                        width: 100%;
                    }
                    .profile-username {
                        width: 100%;
                        text-align: center !important;
                    }
                    .profile-picture-container { 
                        display: flex;
                        justify-content: center;
                        width: 100%;
                        margin-bottom: 20px;
                    }
                    .profile-picture-container img { 
                        width: 120px !important; 
                        height: 120px !important; 
                    }
                }
            `}</style>
        </div>
    )
}

export default Profile