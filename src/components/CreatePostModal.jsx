import { useState } from 'react'
import { X, Upload, Image as ImageIcon, Video } from 'lucide-react'
import api from '../services/api'
import ImageCropper from './ImageCropper'

function CreatePostModal({ currentUser, onClose, onPostCreated, isStoryMode = false }) {
    const [formData, setFormData] = useState({
        caption: ''
    })
    const [selectedFile, setSelectedFile] = useState(null)
    const [mediaType, setMediaType] = useState('image')
    const [imagePreview, setImagePreview] = useState(null)
    const [showCropper, setShowCropper] = useState(false)
    const [croppedImage, setCroppedImage] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [isStory, setIsStory] = useState(isStoryMode) // Use prop as initial value

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.size > 50 * 1024 * 1024) {
                setError('File size must be less than 50MB')
                return
            }

            setSelectedFile(file)
            const fileType = file.type.startsWith('video/') ? 'video' : 'image'
            setMediaType(fileType)

            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result)
                setShowCropper(true)
            }
            reader.onerror = () => {
                setError('Failed to read file')
            }
            reader.readAsDataURL(file)
        }
    }

    const handleCropComplete = (croppedBlob) => {
        if (mediaType === 'video' || croppedBlob === null) {
            setCroppedImage(null)
        } else {
            setCroppedImage(croppedBlob)
        }
        setShowCropper(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!selectedFile && !croppedImage) {
            setError('Please select an image or video')
            return
        }

        setLoading(true)

        try {
            // Prepare file for upload
            let fileToUpload

            if (croppedImage) {
                // Convert blob to File with proper name and type
                fileToUpload = new File(
                    [croppedImage],
                    `cropped_${Date.now()}.jpg`,
                    { type: 'image/jpeg' }
                )
            } else {
                fileToUpload = selectedFile
            }

            console.log('Uploading file:', fileToUpload.name, fileToUpload.size, fileToUpload.type)

            // Upload the file
            const uploadResponse = await api.uploadFile(fileToUpload)
            console.log('Upload response:', uploadResponse.data)

            if (!uploadResponse.data.success) {
                throw new Error(uploadResponse.data.message || 'Upload failed')
            }

            const mediaUrl = uploadResponse.data.url

            // Create post/story
            const postData = {
                user_id: currentUser.id,
                media_url: mediaUrl,
                media_type: mediaType,
                caption: formData.caption
            }

            if (isStory) {
                await api.createStory(postData)
            } else {
                await api.createPost(postData)
            }

            onPostCreated()
            onClose()
        } catch (err) {
            console.error('Upload error:', err)
            const errorMessage = err.response?.data?.message || err.message || 'Failed to create post'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal modal-slide-up" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">✨ {isStoryMode ? 'Create Story' : 'Create New Post'}</h2>
                        <button className="modal-close" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Only show checkbox if NOT in story mode */}
                        {!isStoryMode && (
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                                    <input
                                        type="checkbox"
                                        checked={isStory}
                                        onChange={(e) => setIsStory(e.target.checked)}
                                        style={{ accentColor: 'var(--pink-500)' }}
                                    />
                                    <span>📖 Post as Story (expires in 24h)</span>
                                </label>
                            </div>
                        )}

                        <div className="form-group">
                            <label style={{ fontWeight: 600, color: 'var(--pink-600)' }}>📸 Select Image or Video</label>
                            <div style={{
                                border: '3px dashed var(--pink-300)',
                                borderRadius: '25px',
                                padding: '40px',
                                textAlign: 'center',
                                background: 'linear-gradient(135deg, var(--pink-50) 0%, #fff 100%)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--pink-500)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--pink-300)'}
                            >
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                                    {imagePreview ? (
                                        <div style={{ animation: 'fadeIn 0.5s ease' }}>
                                            {mediaType === 'video' ? (
                                                <>
                                                    <Video size={48} style={{ color: 'var(--pink-500)', margin: '0 auto 10px' }} />
                                                    <p style={{ color: 'var(--pink-600)', fontWeight: 600, fontSize: '16px' }}>
                                                        🎬 Video selected! Click to change
                                                    </p>
                                                    <video
                                                        src={imagePreview}
                                                        style={{
                                                            maxWidth: '100%',
                                                            maxHeight: '200px',
                                                            marginTop: '15px',
                                                            borderRadius: '15px',
                                                            boxShadow: '0 4px 15px rgba(240, 51, 122, 0.2)'
                                                        }}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <ImageIcon size={48} style={{ color: 'var(--pink-500)', margin: '0 auto 10px' }} />
                                                    <p style={{ color: 'var(--pink-600)', fontWeight: 600, fontSize: '16px' }}>
                                                        ✨ Image selected! Click to change
                                                    </p>
                                                    {(croppedImage || imagePreview) && (
                                                        <img
                                                            src={croppedImage ? URL.createObjectURL(croppedImage) : imagePreview}
                                                            alt="Preview"
                                                            style={{
                                                                maxWidth: '100%',
                                                                maxHeight: '200px',
                                                                marginTop: '15px',
                                                                borderRadius: '15px',
                                                                boxShadow: '0 4px 15px rgba(240, 51, 122, 0.2)'
                                                            }}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload size={48} style={{ color: 'var(--pink-400)', margin: '0 auto 10px' }} />
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginTop: '10px' }}>
                                                📷 Click to upload image or video
                                            </p>
                                            <p style={{ color: 'var(--pink-400)', fontSize: '13px', marginTop: '5px' }}>
                                                Max size: 50MB
                                            </p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {!isStory && (
                            <div className="form-group">
                                <label style={{ fontWeight: 600, color: 'var(--pink-600)' }}>💬 Caption</label>
                                <textarea
                                    value={formData.caption}
                                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                                    placeholder="Write a caption... ✨"
                                    rows="4"
                                    style={{
                                        width: '100%',
                                        padding: '14px 18px',
                                        border: '2px solid var(--pink-200)',
                                        borderRadius: '20px',
                                        fontSize: '15px',
                                        fontFamily: 'Quicksand, sans-serif',
                                        background: 'var(--pink-50)',
                                        resize: 'vertical',
                                        transition: 'border 0.3s ease'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--pink-500)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--pink-200)'}
                                />
                            </div>
                        )}

                        {error && (
                            <p style={{
                                color: 'var(--pink-600)',
                                marginBottom: '15px',
                                background: 'var(--pink-100)',
                                padding: '12px',
                                borderRadius: '15px',
                                fontSize: '14px',
                                animation: 'shake 0.5s ease'
                            }}>
                                ⚠️ {error}
                            </p>
                        )}

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn"
                                style={{ background: 'var(--pink-100)', color: 'var(--text-primary)', flex: 1 }}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                {loading ? '⏳ Uploading...' : (isStoryMode ? '📖 Share Story' : '✨ Share')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {showCropper && imagePreview && (
                <ImageCropper
                    image={imagePreview}
                    onComplete={handleCropComplete}
                    onCancel={() => setShowCropper(false)}
                    aspect={isStory ? 9 / 16 : 1}
                    mediaType={mediaType}
                />
            )}
        </>
    )
}

export default CreatePostModal