import { X, Trash2 } from 'lucide-react'

function DeleteConfirmModal({ title, message, onConfirm, onCancel }) {
    return (
        <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 10001 }}>
            <div className="modal modal-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Trash2 size={24} style={{ color: 'var(--pink-600)' }} />
                        {title}
                    </h2>
                    <button className="modal-close" onClick={onCancel}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '20px' }}>
                    <p style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '20px' }}>
                        {message}
                    </p>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={onCancel}
                            className="btn"
                            style={{
                                flex: 1,
                                background: 'var(--pink-100)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="btn"
                            style={{
                                flex: 1,
                                background: 'var(--pink-600)',
                                color: 'white'
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DeleteConfirmModal