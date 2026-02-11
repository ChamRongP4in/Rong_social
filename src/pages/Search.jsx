import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Home as HomeIcon, User, PlusSquare, LogOut, Search as SearchIcon, MessageCircle } from 'lucide-react'
import api from '../services/api'
import { useUnreadCount } from '../hooks/useUnreadCount'
import Footer from '../components/Footer'

function Search({ currentUser, onLogout }) {
    const navigate = useNavigate()
    const unreadCount = useUnreadCount(currentUser)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [loading, setLoading] = useState(false)

    const handleSearch = async (query) => {
        setSearchQuery(query)

        if (query.trim().length < 2) {
            setSearchResults([])
            return
        }

        setLoading(true)
        try {
            const response = await api.searchUsers(query, currentUser.id)
            setSearchResults(response.data.users || [])
        } catch (err) {
            console.error('Search failed:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleMessageUser = async (userId, username) => {
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

    return (
        <div className="app-container">
            {/* Sidebar */}
            <nav className="sidebar">
                <h1 className="logo">Pinktagram</h1>
                <Link to="/" className="nav-item">
                    <HomeIcon size={24} />
                    <span>Home</span>
                </Link>
                <Link to="/search" className="nav-item active">
                    <SearchIcon size={24} />
                    <span>Search</span>
                </Link>
                <Link to="/messages" className="nav-item" style={{ position: 'relative' }}>
                    <MessageCircle size={24} />
                    <span>Messages</span>
                    {unreadCount > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'var(--pink-600)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: '2px solid white',
                            animation: 'pulse 2s infinite'
                        }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                    )}
                </Link>
                <Link to={`/profile/${currentUser.username}`} className="nav-item">
                    <User size={24} />
                    <span>Profile</span>
                </Link>
                <button onClick={onLogout} className="nav-item" style={{ color: 'var(--pink-600)' }}>
                    <LogOut size={24} />
                    <span>Logout</span>
                </button>
            </nav>

            {/* Main Content */}
            <main className="main-content" style={{ paddingBottom: '80px' }}>
                <div style={{
                    background: 'linear-gradient(135deg, var(--pink-100) 0%, white 100%)',
                    borderRadius: '30px',
                    padding: '40px',
                    marginBottom: '30px',
                    boxShadow: '0 8px 25px rgba(240, 51, 122, 0.1)',
                    animation: 'slideUp 0.5s ease'
                }}>
                    <h2 style={{
                        fontSize: '32px',
                        marginBottom: '20px',
                        background: 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-600) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        🔍 Search Users
                    </h2>

                    <div style={{ position: 'relative' }}>
                        <SearchIcon
                            size={20}
                            style={{
                                position: 'absolute',
                                left: '20px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--pink-400)'
                            }}
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search for users... ✨"
                            style={{
                                width: '100%',
                                padding: '15px 20px 15px 50px',
                                border: '2px solid var(--pink-200)',
                                borderRadius: '25px',
                                fontSize: '16px',
                                fontFamily: 'Quicksand, sans-serif',
                                background: 'white',
                                transition: 'border 0.3s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--pink-500)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--pink-200)'}
                        />
                    </div>
                </div>

                {/* Search Results */}
                <div>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="spinner"></div>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div>
                            {searchResults.map((user) => (
                                <div
                                    key={user.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '20px',
                                        background: 'white',
                                        borderRadius: '20px',
                                        marginBottom: '15px',
                                        transition: 'all 0.3s ease',
                                        border: '2px solid var(--pink-100)',
                                        animation: 'slideUp 0.3s ease'
                                    }}
                                >
                                    <img
                                        src={user.profile_picture || 'https://via.placeholder.com/60'}
                                        alt={user.username}
                                        onClick={() => navigate(`/profile/${user.username}`)}
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '3px solid var(--pink-300)',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <div
                                        style={{ marginLeft: '20px', flex: 1, cursor: 'pointer' }}
                                        onClick={() => navigate(`/profile/${user.username}`)}
                                    >
                                        <p style={{ fontWeight: 700, fontSize: '18px', color: 'var(--pink-600)' }}>
                                            {user.username}
                                        </p>
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                                            {user.full_name || 'Pinktagram user'}
                                        </p>
                                        {user.bio && (
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px', maxWidth: '400px' }}>
                                                {user.bio.length > 60 ? user.bio.substring(0, 60) + '...' : user.bio}
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        {user.is_following > 0 && (
                                            <div style={{
                                                background: 'var(--pink-100)',
                                                color: 'var(--pink-600)',
                                                padding: '6px 15px',
                                                borderRadius: '15px',
                                                fontSize: '13px',
                                                fontWeight: 600
                                            }}>
                                                ✓ Following
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleMessageUser(user.id, user.username)
                                            }}
                                            className="btn"
                                            style={{
                                                padding: '10px 20px',
                                                background: 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-600) 100%)',
                                                color: 'white',
                                                border: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <MessageCircle size={18} />
                                            Message
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : searchQuery.length >= 2 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            background: 'var(--pink-50)',
                            borderRadius: '25px',
                            border: '2px dashed var(--pink-200)'
                        }}>
                            <SearchIcon size={64} style={{ color: 'var(--pink-300)', margin: '0 auto 20px' }} />
                            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                                No users found for "{searchQuery}"
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            background: 'var(--pink-50)',
                            borderRadius: '25px',
                            border: '2px dashed var(--pink-200)'
                        }}>
                            <SearchIcon size={64} style={{ color: 'var(--pink-300)', margin: '0 auto 20px' }} />
                            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                                Start typing to search for users... 🔍
                            </p>
                        </div>
                    )}
                </div>

                <Footer />
            </main>
            {/* Mobile Bottom Navigation */}
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
                    <Link to="/messages" style={{ padding: '10px', color: window.location.pathname === '/messages' ? 'var(--pink-600)' : 'var(--text-secondary)', position: 'relative' }}>
                        <MessageCircle size={28} />
                        {unreadCount > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '5px',
                                right: '5px',
                                background: 'var(--pink-600)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 700
                            }}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </div>
                        )}
                    </Link>
                    <Link to={`/profile/${currentUser.username}`} style={{ padding: '10px', color: window.location.pathname.includes('/profile') ? 'var(--pink-600)' : 'var(--text-secondary)' }}>
                        <User size={28} />
                    </Link>
                </div>
            </div>

            <style>{`
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

export default Search