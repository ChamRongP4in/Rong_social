import { useState, useEffect } from 'react'
import { X, Send, Trash2, CornerDownRight } from 'lucide-react'
import api from '../services/api'

function CommentsModal({ post, currentUser, onClose, onUpdate }) {
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState('')
    const [replyTo, setReplyTo] = useState(null) // { id, username }
    const [loading, setLoading] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)

    useEffect(() => {
        loadComments()
    }, [post.id])

    // Auto-focus input when replying
    useEffect(() => {
        if (replyTo) {
            const input = document.getElementById('comment-input')
            if (input) input.focus()
        }
    }, [replyTo])

    const loadComments = async () => {
        try {
            const response = await api.getComments(post.id)
            setComments(response.data.comments || [])
        } catch (err) {
            console.error('Failed to load comments:', err)
        }
    }

    const getText = (c) => c.comment || c.content || c.text || ''

    const handleSubmit = async (e) => {
        e.preventDefault()
        const trimmed = newComment.trim()
        if (!trimmed) return

        setLoading(true)
        try {
            await api.createComment({
                post_id: post.id,
                user_id: currentUser.id,
                content: trimmed,
                parent_id: replyTo ? replyTo.id : null   // ← actual parent_id for nesting
            })
            setNewComment('')
            setReplyTo(null)
            await loadComments()
            onUpdate()
        } catch (err) {
            console.error('Failed to create comment:', err)
            alert('Failed to post comment.')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (commentId) => {
        try {
            await api.deleteComment(commentId, currentUser.id)
            setDeleteTarget(null)
            await loadComments()
            onUpdate()
        } catch (err) {
            console.error('Failed to delete comment:', err)
        }
    }

    // Separate top-level and replies, then nest them
    const buildTree = (flatList) => {
        const map = {}
        const roots = []
        flatList.forEach(c => { map[c.id] = { ...c, children: [] } })
        flatList.forEach(c => {
            if (c.parent_id && map[c.parent_id]) {
                map[c.parent_id].children.push(map[c.id])
            } else {
                roots.push(map[c.id])
            }
        })
        return roots
    }

    const tree = buildTree(comments)

    const renderComment = (comment, depth = 0) => {
        const text = getText(comment)
        const isOwn = String(comment.user_id) === String(currentUser.id)
        const isReplyingToThis = replyTo?.id === comment.id

        return (
            <div key={comment.id}>
                {/* Indentation line for replies */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    marginBottom: '12px',
                    marginLeft: depth > 0 ? `${depth * 36}px` : '0',
                    position: 'relative'
                }}>
                    {/* Vertical line for nested replies */}
                    {depth > 0 && (
                        <div style={{
                            position: 'absolute',
                            left: '-18px',
                            top: '0',
                            width: '2px',
                            height: '100%',
                            background: 'var(--pink-100)',
                            borderRadius: '2px'
                        }} />
                    )}

                    <img
                        src={comment.profile_picture || 'https://via.placeholder.com/34'}
                        alt={comment.username}
                        style={{
                            width: depth > 0 ? '30px' : '36px',
                            height: depth > 0 ? '30px' : '36px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0,
                            border: `2px solid ${isReplyingToThis ? 'var(--pink-400)' : 'var(--pink-200)'}`
                        }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            background: isReplyingToThis ? 'var(--pink-100)' : 'var(--pink-50)',
                            padding: '9px 13px',
                            borderRadius: '14px',
                            marginBottom: '4px',
                            border: isReplyingToThis ? '1px solid var(--pink-300)' : '1px solid transparent',
                            transition: 'all 0.2s'
                        }}>
                            <p style={{
                                fontWeight: 700,
                                fontSize: depth > 0 ? '12px' : '13px',
                                color: 'var(--pink-600)',
                                marginBottom: '2px'
                            }}>
                                {comment.username}
                                {depth > 0 && (
                                    <span style={{
                                        fontSize: '10px',
                                        color: 'var(--pink-400)',
                                        fontWeight: 500,
                                        marginLeft: '6px'
                                    }}>reply</span>
                                )}
                            </p>
                            <p style={{
                                fontSize: '14px',
                                color: 'var(--text-primary)',
                                wordBreak: 'break-word',
                                lineHeight: '1.5'
                            }}>
                                {text}
                            </p>
                        </div>

                        {/* Action bar */}
                        <div style={{
                            display: 'flex',
                            gap: '14px',
                            alignItems: 'center',
                            paddingLeft: '4px'
                        }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {new Date(comment.created_at).toLocaleDateString()}
                            </span>

                            {/* Reply button */}
                            <button
                                onClick={() => setReplyTo(
                                    isReplyingToThis ? null : { id: comment.id, username: comment.username }
                                )}
                                style={{
                                    background: 'none', border: 'none',
                                    color: isReplyingToThis ? 'var(--pink-600)' : 'var(--text-secondary)',
                                    cursor: 'pointer', padding: '0',
                                    fontSize: '12px', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: '3px'
                                }}
                            >
                                <CornerDownRight size={11} />
                                {isReplyingToThis ? 'Cancel' : 'Reply'}
                            </button>

                            {/* Delete - own comments only */}
                            {isOwn && (
                                <button
                                    onClick={() => setDeleteTarget(comment)}
                                    style={{
                                        background: 'none', border: 'none',
                                        color: 'var(--pink-300)', cursor: 'pointer',
                                        padding: '0', fontSize: '12px',
                                        display: 'flex', alignItems: 'center', gap: '3px'
                                    }}
                                >
                                    <Trash2 size={11} /> Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Render children (nested replies) */}
                {comment.children && comment.children.length > 0 && (
                    <div style={{ marginLeft: '18px' }}>
                        {comment.children.map(child => renderComment(child, depth + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div
                    className="modal modal-slide-up"
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxWidth: '600px' }}
                >
                    <div className="modal-header">
                        <h2 className="modal-title">💬 Comments</h2>
                        <button className="modal-close" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>

                    {/* Comments list */}
                    <div style={{
                        maxHeight: '420px', overflowY: 'auto',
                        padding: '16px 20px', background: 'white'
                    }}>
                        {comments.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                                    No comments yet. Be the first! 💭
                                </p>
                            </div>
                        ) : (
                            tree.map(comment => renderComment(comment, 0))
                        )}
                    </div>

                    {/* Reply banner */}
                    {replyTo && (
                        <div style={{
                            padding: '8px 20px',
                            background: 'linear-gradient(135deg, var(--pink-50), var(--pink-100))',
                            borderTop: '1px solid var(--pink-200)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <span style={{
                                fontSize: '13px', color: 'var(--pink-700)',
                                display: 'flex', alignItems: 'center', gap: '5px'
                            }}>
                                <CornerDownRight size={13} />
                                Replying to <strong style={{ marginLeft: '3px' }}>@{replyTo.username}</strong>
                            </span>
                            <button onClick={() => setReplyTo(null)} style={{
                                background: 'none', border: 'none',
                                color: 'var(--pink-500)', cursor: 'pointer',
                                fontSize: '20px', lineHeight: 1, padding: '0 4px'
                            }}>×</button>
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={handleSubmit} style={{
                        padding: '12px 16px', borderTop: '2px solid var(--pink-100)',
                        display: 'flex', gap: '10px', alignItems: 'center'
                    }}>
                        <img
                            src={currentUser.profile_picture || 'https://via.placeholder.com/36'}
                            alt="You"
                            style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                objectFit: 'cover', flexShrink: 0,
                                border: '2px solid var(--pink-300)'
                            }}
                        />
                        <input
                            id="comment-input"
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyTo ? `Reply to @${replyTo.username}...` : 'Add a comment... 💭'}
                            style={{
                                flex: 1, padding: '10px 16px',
                                border: '2px solid var(--pink-200)', borderRadius: '25px',
                                fontSize: '14px', fontFamily: 'Quicksand, sans-serif',
                                background: 'white', outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--pink-400)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--pink-200)'}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !newComment.trim()}
                            style={{
                                background: newComment.trim()
                                    ? 'linear-gradient(135deg, var(--pink-500), var(--pink-600))'
                                    : 'var(--pink-200)',
                                color: 'white', border: 'none', borderRadius: '50%',
                                width: '40px', height: '40px', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: newComment.trim() ? 'pointer' : 'default',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Send size={17} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Delete confirmation */}
            {deleteTarget && (
                <div className="modal-overlay" onClick={() => setDeleteTarget(null)} style={{ zIndex: 10001 }}>
                    <div className="modal modal-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '360px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">🗑️ Delete Comment</h2>
                            <button className="modal-close" onClick={() => setDeleteTarget(null)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{
                                background: 'var(--pink-50)', padding: '12px', borderRadius: '12px',
                                marginBottom: '16px', fontSize: '14px',
                                color: 'var(--text-secondary)', fontStyle: 'italic'
                            }}>
                                "{getText(deleteTarget)}"
                            </div>
                            <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                                Delete this comment? Cannot be undone. 💔
                            </p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setDeleteTarget(null)} className="btn"
                                    style={{ flex: 1, background: 'var(--pink-100)', color: 'var(--text-primary)' }}>
                                    Cancel
                                </button>
                                <button onClick={() => handleDelete(deleteTarget.id)} className="btn"
                                    style={{ flex: 1, background: 'var(--pink-600)', color: 'white' }}>
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default CommentsModal