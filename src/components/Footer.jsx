import { Heart, Sparkles } from 'lucide-react'

function Footer() {
    return (
        <footer style={{
            background: 'linear-gradient(135deg, var(--pink-100) 0%, var(--pink-50) 100%)',
            borderTop: '3px solid var(--pink-300)',
            padding: '30px 20px',
            textAlign: 'center',
            marginTop: 'auto',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Decorative elements */}
            <div style={{
                position: 'absolute',
                top: '-50px',
                left: '-50px',
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(250, 153, 193, 0.3) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'float 6s ease-in-out infinite'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-30px',
                right: '-30px',
                width: '120px',
                height: '120px',
                background: 'radial-gradient(circle, rgba(252, 197, 222, 0.4) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'float 8s ease-in-out infinite reverse'
            }} />

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '10px',
                position: 'relative',
                zIndex: 1
            }}>
                <Sparkles size={20} style={{ color: 'var(--pink-500)', animation: 'pulse 2s ease-in-out infinite' }} />
                <span style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-600) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    Made with
                </span>
                <Heart
                    size={20}
                    style={{
                        color: 'var(--pink-500)',
                        fill: 'var(--pink-500)',
                        animation: 'heartbeat 1.5s ease-in-out infinite'
                    }}
                />
                <Sparkles size={20} style={{ color: 'var(--pink-500)', animation: 'pulse 2s ease-in-out infinite 0.5s' }} />
            </div>

            <p style={{
                fontSize: '15px',
                color: 'var(--pink-600)',
                fontWeight: 500,
                position: 'relative',
                zIndex: 1
            }}>
                ✨ <strong>Developed and Designed by SuonSokChamRong</strong> ✨
            </p>

            <p style={{
                fontSize: '13px',
                color: 'var(--pink-400)',
                marginTop: '8px',
                fontWeight: 500,
                position: 'relative',
                zIndex: 1
            }}>
                © 2026 RongSocial • All Rights Reserved 💗
            </p>
        </footer>
    )
}

export default Footer