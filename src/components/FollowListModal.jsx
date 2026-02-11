import { useState, useEffect } from 'react'
import { X, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function FollowListModal({ userId, currentUser, type, onClose }) {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        loadUsers()
    }, [userId, type])

    const loadUsers = async () => {
        try {
            const response = type === 'followers'
                ? await api.getFollowers(userId, currentUser.id)
                : await api.getFollowing(userId, currentUser.id)
            setUsers(response.data.users || [])
        } catch (err) {
            console.error('Failed to load users:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleFollowToggle = async (targetUserId, isFollowing) => {
        try {
            if (isFollowing) {
                console.log('Unfollowing from modal:', targetUserId)
                await api.unfollowUser(currentUser.id, targetUserId)
            } else {
                console.log('Following from modal:', targetUserId)
                await api.followUser(currentUser.id, targetUserId)
            }
            // Reload the list to show updated status
            loadUsers()
        } catch (err) {
            console.error('Failed to toggle follow:', err)
        }
    }

    const handleUserClick = (username) => {
        onClose()
        navigate(`/profile/${username}`)
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {type === 'followers' ? '💕 Followers' : '✨ Following'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0 20px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--pink-400)' }}>
                            <div className="spinner"></div>
                            <p style={{ marginTop: '15px' }}>Loading...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            <User size={48} style={{ color: 'var(--pink-300)', margin: '0 auto 15px' }} />
                            <p>No {type} yet</p>
                        </div>
                    ) : (
                        <div>
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '15px',
                                        borderBottom: '1px solid var(--pink-100)',
                                        transition: 'background 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--pink-50)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <img
                                        src={user.profile_picture || 'https://via.placeholder.com/50'}
                                        alt={user.username}
                                        style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '2px solid var(--pink-200)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleUserClick(user.username)}
                                    />
                                    <div style={{ flex: 1, marginLeft: '15px', cursor: 'pointer' }} onClick={() => handleUserClick(user.username)}>
                                        <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                                            {user.username}
                                        </p>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {user.full_name || 'Instagram user'}
                                        </p>
                                    </div>
                                    {user.id !== currentUser.id && (
                                        <button
                                            onClick={() => handleFollowToggle(user.id, user.is_following > 0)}
                                            className="btn"
                                            style={{
                                                background: user.is_following > 0 ? 'var(--pink-100)' : 'var(--pink-500)',
                                                color: user.is_following > 0 ? 'var(--text-primary)' : 'white',
                                                padding: '8px 20px',
                                                fontSize: '14px',
                                                minWidth: '100px'
                                            }}
                                        >
                                            {user.is_following > 0 ? 'Following' : 'Follow'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ padding: '20px', borderTop: '2px solid var(--pink-100)' }}>
                    <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default FollowListModal