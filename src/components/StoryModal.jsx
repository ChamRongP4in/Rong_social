import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Plus } from 'lucide-react'
import api from '../services/api'

function StoryModal({ story, currentUser, onClose, onPostStory }) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [liked, setLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(0)
    const [showComments, setShowComments] = useState(false)
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState('')
    const [sendingComment, setSendingComment] = useState(false)

    const stories = story.stories || []
    const currentStory = stories[currentIndex]
    const isOwnStory = currentUser && story.user_id === currentUser.id

    useEffect(() => {
        if (currentStory) {
            // Load initial like status and count
            setLiked(currentStory.is_liked || false)
            setLikeCount(currentStory.likes_count || 0)
            // Load comments if available
            if (currentStory.comments) {
                setComments(currentStory.comments)
            }
        }
    }, [currentIndex, currentStory])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentIndex < stories.length - 1) {
                setCurrentIndex(currentIndex + 1)
            } else {
                onClose()
            }
        }, 5000) // Auto advance after 5 seconds

        return () => clearTimeout(timer)
    }, [currentIndex, stories.length, onClose])

    const goToPrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1) // Fix: Changed from +1 to -1
            setShowComments(false)
        }
    }

    const goToNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1)
            setShowComments(false)
        } else {
            onClose()
        }
    }

    const handleLike = async () => {
        if (!currentUser || !currentStory) return

        try {
            if (liked) {
                // Unlike
                await api.unlikeStory(currentUser.id, currentStory.id)
                setLiked(false)
                setLikeCount(prev => Math.max(0, prev - 1))
            } else {
                // Like
                await api.likeStory(currentUser.id, currentStory.id)
                setLiked(true)
                setLikeCount(prev => prev + 1)
            }
        } catch (err) {
            console.error('Failed to toggle like:', err)
        }
    }

    const handleSendComment = async (e) => {
        e.preventDefault()
        if (!newComment.trim() || !currentUser || !currentStory) return

        setSendingComment(true)
        try {
            const response = await api.commentOnStory({
                user_id: currentUser.id,
                story_id: currentStory.id,
                comment: newComment.trim()
            })

            if (response.data.success) {
                // Add comment to local state
                const comment = {
                    id: response.data.comment_id,
                    username: currentUser.username,
                    profile_picture: currentUser.profile_picture,
                    comment: newComment.trim(),
                    created_at: new Date().toISOString()
                }
                setComments([...comments, comment])
                setNewComment('')
            }
        } catch (err) {
            console.error('Failed to send comment:', err)
        } finally {
            setSendingComment(false)
        }
    }

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            style={{
                background: 'rgba(0, 0, 0, 0.85)', // Darker, cleaner background
                backdropFilter: 'blur(10px)'
            }}
        >
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: '450px',
                    padding: '0',
                    background: 'transparent', // Removed white background
                    borderRadius: '30px',
                    border: 'none', // Removed border
                    boxShadow: 'none', // Removed shadow
                    overflow: 'visible'
                }}
            >
                {/* Progress bars */}
                <div style={{
                    display: 'flex',
                    gap: '6px',
                    padding: '15px 20px',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)'
                }}>
                    {stories.map((_, index) => (
                        <div
                            key={index}
                            style={{
                                flex: 1,
                                height: '3px',
                                background: index === currentIndex
                                    ? 'white'
                                    : index < currentIndex
                                        ? 'rgba(255, 255, 255, 0.8)'
                                        : 'rgba(255, 255, 255, 0.3)',
                                borderRadius: '10px',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    ))}
                </div>

                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '15px 20px',
                    position: 'absolute',
                    top: '25px',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <img
                            src={story.profile_picture || 'https://via.placeholder.com/40'}
                            alt={story.username}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                border: '2px solid white',
                                marginRight: '12px',
                                objectFit: 'cover'
                            }}
                        />
                        <div style={{ flex: 1 }}>
                            <p style={{
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '15px',
                                margin: 0,
                                textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                            }}>
                                {story.username}
                            </p>
                            <p style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: '12px',
                                margin: 0,
                                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                            }}>
                                {currentIndex + 1} of {stories.length}
                            </p>
                        </div>
                    </div>

                    {/* Post Story button (only for own stories) */}
                    {isOwnStory && onPostStory && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onPostStory()
                            }}
                            style={{
                                background: 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-600) 100%)',
                                border: '2px solid white',
                                borderRadius: '20px',
                                padding: '8px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '13px',
                                fontFamily: 'Quicksand, sans-serif',
                                boxShadow: '0 4px 12px rgba(240, 51, 122, 0.3)',
                                transition: 'all 0.3s ease',
                                marginRight: '10px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)'
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(240, 51, 122, 0.5)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(240, 51, 122, 0.3)'
                            }}
                        >
                            <Plus size={16} />
                            <span>Post Story</span>
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(0, 0, 0, 0.5)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            backdropFilter: 'blur(10px)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'
                            e.currentTarget.style.transform = 'scale(1.1)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'
                            e.currentTarget.style.transform = 'scale(1)'
                        }}
                    >
                        <X size={20} color="white" />
                    </button>
                </div>

                {/* Story content */}
                {/* Story content - clean, no background */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '75vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'black', // Pure black background
                    borderRadius: '20px',
                    overflow: 'hidden'
                }}>
                    {currentStory.media_type === 'image' ? (
                        <img
                            src={currentStory.media_url}
                            alt="Story"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain' // Changed to contain for better viewing
                            }}
                        />
                    ) : (
                        <video
                            src={currentStory.media_url}
                            autoPlay
                            loop
                            muted
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    )}

                    {/* Navigation buttons */}
                    {currentIndex > 0 && (
                        <button
                            onClick={goToPrevious}
                            style={{
                                position: 'absolute',
                                left: '15px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '45px',
                                height: '45px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
                                e.currentTarget.style.transform = 'scale(1.1)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                                e.currentTarget.style.transform = 'scale(1)'
                            }}
                        >
                            <ChevronLeft size={24} strokeWidth={2.5} />
                        </button>
                    )}

                    {currentIndex < stories.length - 1 && (
                        <button
                            onClick={goToNext}
                            style={{
                                position: 'absolute',
                                right: '15px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '45px',
                                height: '45px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
                                e.currentTarget.style.transform = 'scale(1.1)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                                e.currentTarget.style.transform = 'scale(1)'
                            }}
                        >
                            <ChevronRight size={24} strokeWidth={2.5} />
                        </button>
                    )}

                    {/* Post Story Button (for own stories or add new) */}
                    {isOwnStory && onPostStory && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onPostStory()
                            }}
                            style={{
                                position: 'absolute',
                                bottom: '100px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-600) 100%)',
                                border: 'none',
                                borderRadius: '25px',
                                padding: '12px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '14px',
                                boxShadow: '0 4px 15px rgba(240, 51, 122, 0.4)',
                                transition: 'all 0.3s ease',
                                zIndex: 5
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)'
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(240, 51, 122, 0.6)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateX(-50%) scale(1)'
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(240, 51, 122, 0.4)'
                            }}
                        >
                            <Plus size={18} />
                            Add to Story
                        </button>
                    )}

                    {/* Reaction & Comment Bar (bottom) - Show for ALL stories */}
                    {currentUser && (
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
                            padding: '20px',
                            display: 'flex',
                            gap: '15px',
                            alignItems: 'center'
                        }}>
                            {/* Like button */}
                            <button
                                onClick={handleLike}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'transform 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <Heart
                                    size={28}
                                    fill={liked ? 'var(--pink-500)' : 'none'}
                                    color={liked ? 'var(--pink-500)' : 'white'}
                                    strokeWidth={2}
                                />
                                {likeCount > 0 && (
                                    <span style={{
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                    }}>
                                        {likeCount}
                                    </span>
                                )}
                            </button>

                            {/* Comment button */}
                            <button
                                onClick={() => setShowComments(!showComments)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'transform 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <MessageCircle size={28} color="white" strokeWidth={2} />
                                {comments.length > 0 && (
                                    <span style={{
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                    }}>
                                        {comments.length}
                                    </span>
                                )}
                            </button>

                            {/* Comment input */}
                            {showComments && (
                                <form
                                    onSubmit={handleSendComment}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'center'
                                    }}
                                >
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Send a message..."
                                        style={{
                                            flex: 1,
                                            background: 'rgba(255, 255, 255, 0.2)',
                                            border: '1px solid rgba(255, 255, 255, 0.3)',
                                            borderRadius: '20px',
                                            padding: '10px 16px',
                                            color: 'white',
                                            fontSize: '14px',
                                            outline: 'none',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim() || sendingComment}
                                        style={{
                                            background: newComment.trim() ? 'var(--pink-500)' : 'rgba(255, 255, 255, 0.2)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <Send size={18} color="white" />
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                {/* Comments list (if showing comments) */}
                {showComments && comments.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        bottom: '80px',
                        left: '20px',
                        right: '20px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        background: 'rgba(0, 0, 0, 0.7)',
                        borderRadius: '15px',
                        padding: '12px',
                        backdropFilter: 'blur(20px)'
                    }}>
                        {comments.map((comment) => (
                            <div key={comment.id} style={{
                                display: 'flex',
                                gap: '10px',
                                marginBottom: '10px',
                                alignItems: 'flex-start'
                            }}>
                                <img
                                    src={comment.profile_picture || 'https://via.placeholder.com/30'}
                                    alt={comment.username}
                                    style={{
                                        width: '30px',
                                        height: '30px',
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <span style={{
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        marginRight: '8px'
                                    }}>
                                        {comment.username}
                                    </span>
                                    <span style={{
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        fontSize: '13px'
                                    }}>
                                        {comment.comment}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default StoryModal