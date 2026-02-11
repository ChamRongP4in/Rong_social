import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X } from 'lucide-react'

function ImageCropper({ image, onComplete, onCancel, aspect = 1, mediaType = 'image' }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const createCroppedImage = async () => {
        try {
            if (mediaType === 'video') {
                // For video, just return the original file
                onComplete(null) // We'll handle video differently
            } else {
                const croppedImage = await getCroppedImg(image, croppedAreaPixels)
                onComplete(croppedImage)
            }
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 10000 }}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">✨ {mediaType === 'video' ? 'Preview Video' : 'Crop Image'}</h2>
                    <button className="modal-close" onClick={onCancel}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ position: 'relative', width: '100%', height: '400px', background: '#000', borderRadius: '20px', overflow: 'hidden' }}>
                    {mediaType === 'video' ? (
                        <video
                            src={image}
                            controls
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    ) : (
                        <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    )}
                </div>

                {mediaType === 'image' && (
                    <div style={{ padding: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: 'var(--pink-600)', fontWeight: 600 }}>
                            🔍 Zoom
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                onChange={(e) => setZoom(e.target.value)}
                                style={{
                                    width: '100%',
                                    marginTop: '8px',
                                    accentColor: 'var(--pink-500)'
                                }}
                            />
                        </label>
                    </div>
                )}

                <div style={{ padding: '0 20px 20px', display: 'flex', gap: '10px' }}>
                    <button
                        onClick={onCancel}
                        className="btn"
                        style={{ background: 'var(--pink-100)', color: 'var(--text-primary)', flex: 1 }}
                    >
                        Cancel
                    </button>
                    <button onClick={createCroppedImage} className="btn btn-primary" style={{ flex: 1 }}>
                        ✨ Done
                    </button>
                </div>
            </div>
        </div>
    )
}

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous')
        image.src = url
    })

async function getCroppedImg(imageSrc, pixelCrop) {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    )

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob)
        }, 'image/jpeg')
    })
}

export default ImageCropper