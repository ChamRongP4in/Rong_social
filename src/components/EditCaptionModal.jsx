import { useState } from 'react'
import { X, Edit2 } from 'lucide-react'
import api from '../services/api'

function EditCaptionModal({ post, onClose, onUpdate }) {
    const [caption, setCaption] = useState(post.caption || '')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            await api.updatePostCaption(post.id, post.user_id, caption)
            onUpdate()
            onClose()
        } catch (err) {
            console.error('Failed to update caption:', err)
            alert('Failed to update caption')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal modal-slide-up"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: '450px',
                    borderRadius: '30px',
                    overflow: 'hidden'
                }}
            >
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
                        <Edit2 size={24} style={{ color: 'var(--pink-600)' }} />
                        ✏️ Edit Caption
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '30px' }}>
                    <p style={{
                        fontSize: '15px',
                        color: 'var(--text-primary)',
                        marginBottom: '20px',
                        lineHeight: '1.6'
                    }}>
                        Update your caption to better describe your post! ✨
                    </p>

                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Write a caption... 💭"
                        style={{
                            width: '100%',
                            minHeight: '120px',
                            padding: '15px',
                            border: '2px solid var(--pink-200)',
                            borderRadius: '15px',
                            fontSize: '15px',
                            fontFamily: 'Quicksand, sans-serif',
                            resize: 'vertical',
                            marginBottom: '20px',
                            background: 'var(--pink-50)',
                            transition: 'border-color 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--pink-400)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--pink-200)'}
                        disabled={loading}
                    />

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn"
                            style={{
                                flex: 1,
                                background: 'var(--pink-100)',
                                color: 'var(--text-primary)',
                                border: 'none',
                                padding: '14px',
                                borderRadius: '15px',
                                fontSize: '15px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--pink-200)'}
                            onMouseLeave={(e) => e.target.style.background = 'var(--pink-100)'}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{
                                flex: 1,
                                background: 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-600) 100%)',
                                border: 'none',
                                padding: '14px',
                                borderRadius: '15px',
                                fontSize: '15px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                opacity: loading ? 0.7 : 1
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : '✨ Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditCaptionModal