import { useState } from 'react'
import { X, Upload, Camera } from 'lucide-react'
import api from '../services/api'
import ImageCropper from './ImageCropper'

function EditProfileModal({ currentUser, profile, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        profile_picture: profile.profile_picture || ''
    })
    const [selectedFile, setSelectedFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [showCropper, setShowCropper] = useState(false)
    const [croppedImage, setCroppedImage] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file')
                return
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('Image size must be less than 10MB')
                return
            }

            setError('')
            setSelectedFile(file)
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
        setCroppedImage(croppedBlob)
        setShowCropper(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            let profilePictureUrl = formData.profile_picture

            // Upload new profile picture if cropped
            if (croppedImage) {
                console.log('Uploading cropped image...')

                // Convert blob to file
                const uploadFile = new File([croppedImage], 'profile_picture.jpg', { type: 'image/jpeg' })

                const uploadResponse = await api.uploadFile(uploadFile)
                console.log('Upload response:', uploadResponse.data)

                if (!uploadResponse.data.success) {
                    throw new Error(uploadResponse.data.message || 'Upload failed')
                }

                profilePictureUrl = uploadResponse.data.url
            }

            const updateData = {
                user_id: currentUser.id,
                full_name: formData.full_name,
                bio: formData.bio,
                profile_picture: profilePictureUrl
            }

            console.log('Updating profile with data:', updateData)
            await api.updateProfile(updateData)

            // Update localStorage
            const updatedUser = {
                ...currentUser,
                full_name: formData.full_name,
                bio: formData.bio,
                profile_picture: profilePictureUrl
            }
            localStorage.setItem('user', JSON.stringify(updatedUser))

            onUpdate()
        } catch (err) {
            console.error('Profile update error:', err)
            setError(err.response?.data?.message || err.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const displayImage = croppedImage
        ? URL.createObjectURL(croppedImage)
        : (formData.profile_picture || 'https://via.placeholder.com/150')

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal modal-slide-up" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">✨ Edit Profile</h2>
                        <button className="modal-close" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group" style={{ textAlign: 'center' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <img
                                    src={displayImage}
                                    alt="Profile"
                                    style={{
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '4px solid var(--pink-300)',
                                        boxShadow: '0 4px 15px rgba(240, 51, 122, 0.3)',
                                        transition: 'transform 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                    id="profile-upload"
                                />
                                <label
                                    htmlFor="profile-upload"
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        background: 'var(--pink-500)',
                                        borderRadius: '50%',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        border: '3px solid white',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                        transition: 'transform 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <Camera size={20} color="white" />
                                </label>
                            </div>
                            <p style={{ marginTop: '10px', color: 'var(--pink-500)', fontSize: '13px' }}>
                                📷 Click camera icon to change photo
                            </p>
                        </div>

                        <div className="form-group">
                            <label style={{ fontWeight: 600, color: 'var(--pink-600)' }}>👤 Full Name</label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="Your full name"
                                style={{
                                    transition: 'border 0.3s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--pink-500)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--pink-200)'}
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ fontWeight: 600, color: 'var(--pink-600)' }}>💭 Bio</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Tell us about yourself... ✨"
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
                                {loading ? '⏳ Saving...' : '💾 Save Changes'}
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
                    aspect={1}
                    mediaType="image"
                />
            )}
        </>
    )
}

export default EditProfileModal