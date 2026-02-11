import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Home as HomeIcon, User, PlusSquare, LogOut, Heart, MessageCircle, Share2, Trash2, X, Search as SearchIcon, Bookmark, Edit2, MoreVertical, Plus } from 'lucide-react'
import api from '../services/api'
import { formatTimeAgo } from '../utils/timeUtils'
import CreatePostModal from '../components/CreatePostModal'
import StoryModal from '../components/StoryModal'
import CommentsModal from '../components/CommentsModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import EditCaptionModal from '../components/EditCaptionModal'
import Footer from '../components/Footer'

function Home({ currentUser, onLogout }) {
    const navigate = useNavigate()
    const [posts, setPosts] = useState([])
    const [stories, setStories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [isStoryMode, setIsStoryMode] = useState(false) // Track if opening for story
    const [selectedStory, setSelectedStory] = useState(null)
    const [commentsModal, setCommentsModal] = useState(null)
    const [deleteModal, setDeleteModal] = useState(null)
    const [fullPostModal, setFullPostModal] = useState(null)
    const [likedPosts, setLikedPosts] = useState({})
    const [postComments, setPostComments] = useState({})
    const [showHeart, setShowHeart] = useState({})
    const [savedPosts, setSavedPosts] = useState({})
    const [editCaptionModal, setEditCaptionModal] = useState(null)
    const [showPostMenu, setShowPostMenu] = useState(null) // { postId: number }


    useEffect(() => {
        loadFeed()
        loadSavedPosts()
    }, [])

    const loadFeed = async () => {
        try {
            const [postsRes, storiesRes] = await Promise.all([
                api.getPosts(),
                api.getStories()
            ])
            const loadedPosts = postsRes.data.posts || []
            setPosts(loadedPosts)
            setStories(storiesRes.data.stories || [])

            loadedPosts.forEach(post => {
                if (post.comments_count > 0) {
                    loadLatestComments(post.id)
                }
            })
        } catch (err) {
            console.error('Failed to load feed:', err)
        } finally {
            setLoading(false)
        }
    }

    const loadSavedPosts = async () => {
        try {
            const response = await api.getSavedPosts(currentUser.id)
            const saved = response.data.posts || []
            const savedMap = {}
            saved.forEach(post => {
                savedMap[post.id] = true
            })
            setSavedPosts(savedMap)
        } catch (err) {
            console.error('Failed to load saved posts:', err)
        }
    }

    const loadLatestComments = async (postId) => {
        try {
            const response = await api.getComments(postId)
            const comments = response.data.comments || []
            const topLevelComments = comments.filter(comment => !comment.parent_id)
            const latestComments = topLevelComments.slice(0, 2)
            setPostComments(prev => ({
                ...prev,
                [postId]: latestComments
            }))
        } catch (err) {
            console.error(`Failed to load comments for post ${postId}:`, err)
        }
    }

    const handleLike = async (postId) => {
        try {
            if (likedPosts[postId]) {
                await api.unlikePost(currentUser.id, postId)
                setLikedPosts({ ...likedPosts, [postId]: false })
            } else {
                await api.likePost(currentUser.id, postId)
                setLikedPosts({ ...likedPosts, [postId]: true })
            }
            loadFeed()
        } catch (err) {
            console.error('Failed to toggle like:', err)
        }
    }

    const handleDoubleTap = async (postId) => {
        setShowHeart({ ...showHeart, [postId]: true })
        setTimeout(() => {
            setShowHeart({ ...showHeart, [postId]: false })
        }, 1000)

        if (!likedPosts[postId]) {
            await handleLike(postId)
        }
    }

    const handleSavePost = async (postId) => {
        try {
            if (savedPosts[postId]) {
                await api.unsavePost(currentUser.id, postId)
                setSavedPosts({ ...savedPosts, [postId]: false })
            } else {
                await api.savePost(currentUser.id, postId)
                setSavedPosts({ ...savedPosts, [postId]: true })
            }
        } catch (err) {
            // Handle 409 conflict (already saved)
            if (err.response?.status === 409) {
                console.log('Post already saved')
                setSavedPosts({ ...savedPosts, [postId]: true })
            } else {
                console.error('Failed to toggle save:', err)
            }
        }
    }

    const handleDeletePost = async (postId) => {
        try {
            await api.deletePost(postId, currentUser.id)
            setDeleteModal(null)
            setFullPostModal(null)
            loadFeed()
        } catch (err) {
            console.error('Failed to delete post:', err)
            alert('Failed to delete post')
        }
    }

    const handleShare = async (post) => {
        const postUrl = `${window.location.origin}/post/${post.id}`

        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${post.username}'s post on Pinktagram`,
                    text: post.caption || 'Check out this post!',
                    url: postUrl
                })
            } else {
                await navigator.clipboard.writeText(postUrl)
                alert('✨ Link copied to clipboard!')
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Failed to share:', err)
            }
        }
    }

    const handleMessageAuthor = async (userId, username) => {
        try {
            const response = await api.createConversation(currentUser.id, userId)
            console.log('Conversation created:', response.data)

            navigate('/messages', {
                state: {
                    selectedUserId: userId,
                    selectedUsername: username
                }
            })
        } catch (err) {
            console.error('Failed to start chat:', err)
        }
    }

    const openFullPost = (post) => {
        setFullPostModal(post)
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div className="app-container">
            <nav className="sidebar">
                <h1 className="logo">Pinktagram</h1>
                <Link to="/" className="nav-item active">
                    <HomeIcon size={24} />
                    <span>Home</span>
                </Link>
                <Link to="/search" className="nav-item">
                    <SearchIcon size={24} />
                    <span>Search</span>
                </Link>
                <Link to="/messages" className="nav-item">
                    <MessageCircle size={24} />
                    <span>Messages</span>
                </Link>
                <Link to={`/profile/${currentUser.username}`} className="nav-item">
                    <User size={24} />
                    <span>Profile</span>
                </Link>
                <button onClick={() => {
                    setIsStoryMode(false)
                    setShowCreateModal(true)
                }} className="nav-item">
                    <PlusSquare size={24} />
                    <span>Create</span>
                </button>
            </nav>

            <main className="main-content" style={{ paddingBottom: '80px' }}>
                {/* Stories Bar */}
                <div className="stories-bar">
                    {/* Add Story Button */}
                    <div
                        className="story-item"
                        onClick={() => {
                            setIsStoryMode(true)
                            setShowCreateModal(true)
                        }}
                        style={{
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                    >
                        <div className="story-avatar" style={{
                            background: 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-600) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none'
                        }}>
                            <Plus size={32} color="white" strokeWidth={3} />
                        </div>
                        <span className="story-username" style={{ color: 'var(--pink-600)', fontWeight: 600 }}>
                            Add Story
                        </span>
                    </div>

                    {/* Existing Stories */}
                    {stories.map((story) => (
                        <div
                            key={story.user_id}
                            className="story-item"
                            onClick={() => setSelectedStory(story)}
                        >
                            <div className="story-avatar">
                                <img src={story.profile_picture || 'https://via.placeholder.com/60'} alt={story.username} />
                            </div>
                            <span className="story-username">{story.username}</span>
                        </div>
                    ))}
                </div>

                <div className="posts-feed">
                    {posts.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            background: 'var(--pink-50)',
                            borderRadius: '25px',
                            border: '2px dashed var(--pink-200)'
                        }}>
                            <PlusSquare size={64} style={{ color: 'var(--pink-300)', margin: '0 auto 20px' }} />
                            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '20px' }}>
                                No posts yet. Start creating! 📸
                            </p>
                            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                                ✨ Create Your First Post
                            </button>
                        </div>
                    ) : (
                        posts.map((post) => (
                            <div key={post.id} className="post-card">
                                <div className="post-header">
                                    <img
                                        src={post.profile_picture || 'https://via.placeholder.com/40'}
                                        alt={post.username}
                                        className="post-avatar"
                                        onClick={() => navigate(`/profile/${post.username}`)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <p
                                            className="post-username"
                                            onClick={() => navigate(`/profile/${post.username}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {post.username}
                                        </p>
                                        <p className="post-date">{formatTimeAgo(post.created_at)}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        {String(post.user_id) !== String(currentUser.id) && (
                                            <button
                                                onClick={() => handleMessageAuthor(post.user_id, post.username)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: 'var(--pink-500)',
                                                    padding: '8px',
                                                    borderRadius: '8px',
                                                    transition: 'background 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => e.target.style.background = 'var(--pink-100)'}
                                                onMouseLeave={(e) => e.target.style.background = 'none'}
                                                title="Send message"
                                            >
                                                <MessageCircle size={20} />
                                            </button>
                                        )}
                                        {String(post.user_id) === String(currentUser.id) && (
                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    onClick={() => setShowPostMenu(showPostMenu === post.id ? null : post.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: 'var(--pink-500)',
                                                        padding: '8px',
                                                        borderRadius: '8px',
                                                        transition: 'background 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = 'var(--pink-100)'}
                                                    onMouseLeave={(e) => e.target.style.background = 'none'}
                                                >
                                                    <MoreVertical size={20} />
                                                </button>

                                                {showPostMenu === post.id && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        right: 0,
                                                        background: 'white',
                                                        borderRadius: '15px',
                                                        boxShadow: '0 8px 25px rgba(240, 51, 122, 0.2)',
                                                        border: '2px solid var(--pink-100)',
                                                        minWidth: '180px',
                                                        zIndex: 1000,
                                                        overflow: 'hidden',
                                                        marginTop: '5px'
                                                    }}>
                                                        <button
                                                            onClick={() => {
                                                                setEditCaptionModal(post)
                                                                setShowPostMenu(null)
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                padding: '12px 15px',
                                                                background: 'white',
                                                                border: 'none',
                                                                textAlign: 'left',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                fontSize: '14px',
                                                                color: 'var(--text-primary)',
                                                                transition: 'background 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.background = 'var(--pink-50)'}
                                                            onMouseLeave={(e) => e.target.style.background = 'white'}
                                                        >
                                                            <Edit2 size={16} style={{ color: 'var(--pink-600)' }} />
                                                            Edit Caption
                                                        </button>
                                                        <div style={{ height: '1px', background: 'var(--pink-100)' }}></div>
                                                        <button
                                                            onClick={() => {
                                                                setDeleteModal(post)
                                                                setShowPostMenu(null)
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                padding: '12px 15px',
                                                                background: 'white',
                                                                border: 'none',
                                                                textAlign: 'left',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                fontSize: '14px',
                                                                color: '#dc2626',
                                                                transition: 'background 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.background = '#fee2e2'}
                                                            onMouseLeave={(e) => e.target.style.background = 'white'}
                                                        >
                                                            <Trash2 size={16} />
                                                            Delete Post
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {post.caption && (
                                    <div style={{ padding: '15px 20px 10px' }}>
                                        <span
                                            style={{ fontWeight: 600, marginRight: '8px', cursor: 'pointer', color: 'var(--pink-600)' }}
                                            onClick={() => navigate(`/profile/${post.username}`)}
                                        >
                                            {post.username}
                                        </span>
                                        <span style={{ color: 'var(--text-primary)' }}>{post.caption}</span>
                                    </div>
                                )}

                                <div
                                    className="post-media"
                                    onClick={() => openFullPost(post)}
                                    onDoubleClick={() => handleDoubleTap(post.id)}
                                    style={{ cursor: 'pointer', position: 'relative' }}
                                >
                                    {post.media_type === 'video' ? (
                                        <video
                                            src={post.media_url}
                                            loop
                                            muted
                                            playsInline
                                            onMouseEnter={(e) => e.target.play()}
                                            onMouseLeave={(e) => {
                                                e.target.pause()
                                                e.target.currentTime = 0
                                            }}
                                            style={{ width: '100%', borderRadius: '20px', maxHeight: '600px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <img
                                            src={post.media_url}
                                            alt="Post"
                                            style={{ width: '100%', borderRadius: '20px', maxHeight: '600px', objectFit: 'cover' }}
                                        />
                                    )}

                                    {showHeart[post.id] && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            animation: 'heartPop 1s ease-out',
                                            pointerEvents: 'none',
                                            zIndex: 10
                                        }}>
                                            <Heart
                                                size={100}
                                                fill="white"
                                                color="white"
                                                style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.3))' }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="post-actions">
                                    <button
                                        className="action-btn"
                                        onClick={() => handleLike(post.id)}
                                        style={{ color: likedPosts[post.id] ? 'var(--pink-600)' : 'inherit' }}
                                    >
                                        <Heart size={24} fill={likedPosts[post.id] ? 'var(--pink-600)' : 'none'} />
                                    </button>
                                    <button className="action-btn" onClick={() => setCommentsModal(post)}>
                                        <MessageCircle size={24} />
                                    </button>
                                    <button className="action-btn" onClick={() => handleShare(post)}>
                                        <Share2 size={24} />
                                    </button>
                                    <button
                                        className="action-btn"
                                        onClick={() => handleSavePost(post.id)}
                                        style={{ color: savedPosts[post.id] ? 'var(--pink-600)' : 'inherit' }}
                                    >
                                        <Bookmark size={24} fill={savedPosts[post.id] ? 'var(--pink-600)' : 'none'} />
                                    </button>
                                </div>

                                <div className="post-stats">
                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {post.likes_count || 0} likes
                                    </p>
                                </div>

                                {postComments[post.id] && postComments[post.id].length > 0 && (
                                    <div style={{ padding: '0 20px 10px' }}>
                                        {postComments[post.id].map((comment) => (
                                            <div key={comment.id} style={{ marginBottom: '8px' }}>
                                                <span
                                                    style={{
                                                        fontWeight: 600,
                                                        marginRight: '8px',
                                                        cursor: 'pointer',
                                                        color: 'var(--pink-600)',
                                                        fontSize: '14px'
                                                    }}
                                                    onClick={() => navigate(`/profile/${comment.username}`)}
                                                >
                                                    {comment.username}
                                                </span>
                                                <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                                                    {comment.content || comment.comment}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {post.comments_count > 0 && (
                                    <button
                                        onClick={() => setCommentsModal(post)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            padding: '0 20px 15px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {post.comments_count > 2 ? `View all ${post.comments_count} comments` : `View comments`}
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <Footer />
            </main>

            <button
                className="create-btn-mobile"
                onClick={() => setShowCreateModal(true)}
            >
                <PlusSquare size={28} />
            </button>

            {fullPostModal && (
                <div className="modal-overlay" onClick={() => setFullPostModal(null)} style={{ zIndex: 10000 }}>
                    <div
                        className="modal modal-slide-up"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '900px',
                            padding: 0,
                            overflow: 'hidden',
                            width: '95%',
                            maxHeight: '90vh'
                        }}
                    >
                        <div className="modal-header" style={{ padding: '20px 30px' }}>
                            <h2 className="modal-title">📸 Post</h2>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {fullPostModal.user_id === currentUser.id && (
                                    <button
                                        onClick={() => setDeleteModal(fullPostModal)}
                                        style={{
                                            background: 'var(--pink-100)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: 'var(--pink-600)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = 'var(--pink-200)'}
                                        onMouseLeave={(e) => e.target.style.background = 'var(--pink-100)'}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                                <button className="modal-close" onClick={() => setFullPostModal(null)}>
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', maxHeight: '80vh' }}>
                            <div style={{
                                flex: window.innerWidth < 768 ? 'none' : 1,
                                background: 'black',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: window.innerWidth < 768 ? '300px' : 'auto'
                            }}>
                                {fullPostModal.media_type === 'video' ? (
                                    <video
                                        src={fullPostModal.media_url}
                                        controls
                                        autoPlay
                                        style={{
                                            width: '100%',
                                            maxHeight: window.innerWidth < 768 ? '400px' : '80vh',
                                            objectFit: 'contain'
                                        }}
                                    />
                                ) : (
                                    <img
                                        src={fullPostModal.media_url}
                                        alt="Post"
                                        style={{
                                            width: '100%',
                                            maxHeight: window.innerWidth < 768 ? '400px' : '80vh',
                                            objectFit: 'contain'
                                        }}
                                    />
                                )}
                            </div>

                            <div style={{
                                width: window.innerWidth < 768 ? '100%' : '400px',
                                display: 'flex',
                                flexDirection: 'column',
                                background: 'white',
                                maxHeight: window.innerWidth < 768 ? '300px' : 'auto',
                                overflowY: 'auto'
                            }}>
                                <div style={{ padding: '20px', borderBottom: '1px solid var(--pink-100)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img
                                        src={fullPostModal.profile_picture || 'https://via.placeholder.com/40'}
                                        alt={fullPostModal.username}
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '2px solid var(--pink-300)'
                                        }}
                                    />
                                    <div>
                                        <p style={{ fontWeight: 600, color: 'var(--pink-600)' }}>{fullPostModal.username}</p>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {formatTimeAgo(fullPostModal.created_at)}
                                        </p>
                                    </div>
                                </div>

                                {fullPostModal.caption && (
                                    <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--pink-100)' }}>
                                        <p style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                                            <strong>{fullPostModal.username}</strong> {fullPostModal.caption}
                                        </p>
                                    </div>
                                )}

                                <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--pink-100)' }}>
                                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{fullPostModal.likes_count || 0} likes</p>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                                        {fullPostModal.comments_count || 0} comments
                                    </p>
                                </div>

                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                    <button
                                        onClick={() => {
                                            setCommentsModal(fullPostModal)
                                            setFullPostModal(null)
                                        }}
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                    >
                                        💬 View All Comments
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <CreatePostModal
                    currentUser={currentUser}
                    isStoryMode={isStoryMode}
                    onClose={() => {
                        setShowCreateModal(false)
                        setIsStoryMode(false)
                    }}
                    onPostCreated={() => {
                        setShowCreateModal(false)
                        setIsStoryMode(false)
                        loadFeed()
                    }}
                />
            )}

            {selectedStory && (
                <StoryModal
                    story={selectedStory}
                    onClose={() => setSelectedStory(null)}
                />
            )}

            {commentsModal && (
                <CommentsModal
                    post={commentsModal}
                    currentUser={currentUser}
                    onClose={() => {
                        setCommentsModal(null)
                        loadFeed()
                    }}
                    onUpdate={() => {
                        setCommentsModal(null)
                        loadFeed()
                    }}
                />
            )}

            {deleteModal && (
                <DeleteConfirmModal
                    title="Delete Post"
                    message="Are you sure you want to delete this post? This action cannot be undone."
                    onConfirm={() => handleDeletePost(deleteModal.id)}
                    onCancel={() => setDeleteModal(null)}
                />
            )}

            {editCaptionModal && (
                <EditCaptionModal
                    post={editCaptionModal}
                    onClose={() => setEditCaptionModal(null)}
                    onUpdate={() => {
                        setEditCaptionModal(null)
                        loadFeed()
                    }}
                />
            )}

            <div style={{
                display: 'none',
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'white',
                borderTop: '2px solid var(--pink-100)',
                padding: '10px 0',
                zIndex: 1000
            }} className="mobile-bottom-nav">
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    maxWidth: '500px',
                    margin: '0 auto'
                }}>
                    <Link to="/" style={{ padding: '10px', color: window.location.pathname === '/' ? 'var(--pink-600)' : 'var(--text-secondary)' }}>
                        <HomeIcon size={28} />
                    </Link>
                    <Link to="/search" style={{ padding: '10px', color: window.location.pathname === '/search' ? 'var(--pink-600)' : 'var(--text-secondary)' }}>
                        <SearchIcon size={28} />
                    </Link>
                    <Link to="/messages" style={{ padding: '10px', color: window.location.pathname === '/messages' ? 'var(--pink-600)' : 'var(--text-secondary)' }}>
                        <MessageCircle size={28} />
                    </Link>
                    <Link to={`/profile/${currentUser.username}`} style={{ padding: '10px', color: window.location.pathname.includes('/profile') ? 'var(--pink-600)' : 'var(--text-secondary)' }}>
                        <User size={28} />
                    </Link>
                </div>
            </div>

            <style>{`
                @keyframes heartPop {
                    0% {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 0;
                    }
                    15% {
                        transform: translate(-50%, -50%) scale(1.2);
                        opacity: 1;
                    }
                    30% {
                        transform: translate(-50%, -50%) scale(1);
                    }
                    80% {
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1.3);
                        opacity: 0;
                    }
                }

                @media (max-width: 768px) {
                    .mobile-bottom-nav {
                        display: block !important;
                    }
                    .sidebar {
                        display: none !important;
                    }
                    .main-content {
                        padding-bottom: 80px !important;
                    }
                }
            `}</style>
        </div>
    )
}

export default Home