import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Home as HomeIcon, User, MessageCircle, LogOut, Search as SearchIcon, Send } from 'lucide-react'
import api from '../services/api'
import { useUnreadCount } from '../hooks/useUnreadCount'
import Footer from '../components/Footer'

function Messages({ currentUser, onLogout }) {
    const navigate = useNavigate()
    const location = useLocation()
    const unreadCount = useUnreadCount(currentUser)
    const [conversations, setConversations] = useState([])
    const [selectedConversation, setSelectedConversation] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [previousMessageCount, setPreviousMessageCount] = useState(0)
    const handledNavState = useRef(false) // Prevent handling nav state twice

    useEffect(() => {
        loadConversations()
    }, [])

    // After conversations load, auto-select from navigation state
    useEffect(() => {
        if (loading) return  // Wait until conversations have loaded
        if (handledNavState.current) return  // Already handled

        const locationState = location.state
        if (!locationState?.selectedUserId) return

        handledNavState.current = true  // Mark as handled
        const targetUserId = String(locationState.selectedUserId)
        const conv = conversations.find(c => String(c.other_user_id) === targetUserId)

        if (conv) {
            setSelectedConversation(conv)
        } else {
            // Create new conversation then open it
            createNewConversation(locationState.selectedUserId, locationState.selectedUsername)
        }
    }, [loading, conversations])

    useEffect(() => {
        if (selectedConversation) {
            loadMessages()
            markAsRead()
            const interval = setInterval(loadMessages, 3000)
            return () => clearInterval(interval)
        }
    }, [selectedConversation])

    const createNewConversation = async (userId, username) => {
        try {
            await api.createConversation(currentUser.id, userId)
            // Get fresh list then select the new conversation
            const updated = await loadConversationsFresh()
            const conv = updated.find(c => String(c.other_user_id) === String(userId))
            if (conv) {
                setSelectedConversation(conv)
            }
        } catch (err) {
            console.error('Failed to create conversation:', err)
        }
    }

    const loadConversations = async () => {
        try {
            const response = await api.getConversations(currentUser.id)
            setConversations(response.data.conversations || [])
        } catch (err) {
            console.error('Failed to load conversations:', err)
        } finally {
            setLoading(false)  // This triggers the nav state effect above
        }
    }

    const loadConversationsFresh = async () => {
        try {
            const response = await api.getConversations(currentUser.id)
            const updated = response.data.conversations || []
            setConversations(updated)
            return updated
        } catch (err) {
            console.error('Failed to reload conversations:', err)
            return []
        }
    }

    const loadMessages = async () => {
        if (!selectedConversation) return
        try {
            const response = await api.getMessages(selectedConversation.conversation_id)
            const newMessages = response.data.messages || []

            // Play sound if new message arrived
            if (newMessages.length > previousMessageCount && previousMessageCount > 0) {
                const latestMessage = newMessages[newMessages.length - 1]
                if (String(latestMessage.sender_id) !== String(currentUser.id)) {
                    try {
                        const audio = new Audio('/notification.mp3')
                        audio.volume = 0.3
                        audio.play().catch(err => console.log('Audio play failed:', err))
                    } catch (err) {
                        console.log('Notification sound error:', err)
                    }
                }
            }

            setPreviousMessageCount(newMessages.length)
            setMessages(newMessages)

            setTimeout(() => {
                const messagesContainer = document.getElementById('messages-container')
                if (messagesContainer) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight
                }
            }, 100)
        } catch (err) {
            console.error('Failed to load messages:', err)
        }
    }

    const markAsRead = async () => {
        if (!selectedConversation) return
        try {
            await api.markMessagesAsRead(selectedConversation.conversation_id, currentUser.id)
            loadConversations()
        } catch (err) {
            console.error('Failed to mark as read:', err)
        }
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedConversation) return

        setSending(true)
        try {
            await api.sendMessage(
                selectedConversation.conversation_id,
                currentUser.id,
                selectedConversation.other_user_id,
                newMessage
            )
            setNewMessage('')
            loadMessages()
            loadConversations()
        } catch (err) {
            console.error('Failed to send message:', err)
        } finally {
            setSending(false)
        }
    }

    const formatTime = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInHours = (now - date) / (1000 * 60 * 60)

        if (diffInHours < 1) return 'Just now'
        if (diffInHours < 24) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        if (diffInHours < 48) return 'Yesterday'
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
                <Link to="/search" className="nav-item">
                    <SearchIcon size={24} />
                    <span>Search</span>
                </Link>
                <Link to="/messages" className="nav-item active">
                    <MessageCircle size={24} />
                    <span>Messages</span>
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
                    display: 'flex',
                    height: 'calc(100vh - 100px)',
                    background: 'white',
                    borderRadius: '30px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 25px rgba(240, 51, 122, 0.1)'
                }}>
                    {/* Conversations List */}
                    <div style={{
                        width: '350px',
                        borderRight: '2px solid var(--pink-100)',
                        display: 'flex',
                        flexDirection: 'column'
                    }} className="conversations-list">
                        <div style={{
                            padding: '25px',
                            borderBottom: '2px solid var(--pink-100)',
                            background: 'linear-gradient(135deg, var(--pink-50) 0%, white 100%)'
                        }}>
                            <h2 style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-600) 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                💬 Messages
                            </h2>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div className="spinner"></div>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                                    <MessageCircle size={64} style={{ color: 'var(--pink-300)', margin: '0 auto 20px' }} />
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                                        No messages yet
                                    </p>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '10px' }}>
                                        Start a conversation from a user's profile! 💗
                                    </p>
                                </div>
                            ) : (
                                conversations.map((conv) => (
                                    <div
                                        key={conv.conversation_id}
                                        onClick={() => setSelectedConversation(conv)}
                                        style={{
                                            padding: '15px 20px',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s ease',
                                            background: selectedConversation?.conversation_id === conv.conversation_id ? 'var(--pink-50)' : 'white',
                                            borderLeft: selectedConversation?.conversation_id === conv.conversation_id ? '4px solid var(--pink-500)' : '4px solid transparent'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedConversation?.conversation_id !== conv.conversation_id) {
                                                e.currentTarget.style.background = 'var(--pink-50)'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedConversation?.conversation_id !== conv.conversation_id) {
                                                e.currentTarget.style.background = 'white'
                                            }
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ position: 'relative' }}>
                                                <img
                                                    src={conv.profile_picture || 'https://via.placeholder.com/50'}
                                                    alt={conv.username}
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
                                                        border: '2px solid var(--pink-300)'
                                                    }}
                                                />
                                                {conv.unread_count > 0 && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '-5px',
                                                        right: '-5px',
                                                        background: 'var(--pink-600)',
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        width: '22px',
                                                        height: '22px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        border: '2px solid white'
                                                    }}>
                                                        {conv.unread_count}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{
                                                    fontWeight: conv.unread_count > 0 ? 700 : 600,
                                                    fontSize: '15px',
                                                    color: 'var(--pink-600)',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {conv.username}
                                                </p>
                                                <p style={{
                                                    fontSize: '13px',
                                                    color: conv.unread_count > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                    fontWeight: conv.unread_count > 0 ? 600 : 400,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {conv.last_message || 'Start chatting...'}
                                                </p>
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                {conv.last_message_time && formatTime(conv.last_message_time)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} className="chat-area">
                        {selectedConversation ? (
                            <>
                                {/* Chat Header */}
                                <div style={{
                                    padding: '20px 30px',
                                    borderBottom: '2px solid var(--pink-100)',
                                    background: 'linear-gradient(135deg, var(--pink-50) 0%, white 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px'
                                }}>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault()
                                            setSelectedConversation(null)
                                        }}
                                        className="mobile-back-btn"
                                        style={{
                                            display: 'none',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '5px',
                                            color: 'var(--pink-600)',
                                            fontSize: '16px',
                                            fontWeight: 600
                                        }}
                                    >
                                        ← Back
                                    </button>

                                    <img
                                        src={selectedConversation.profile_picture || 'https://via.placeholder.com/50'}
                                        alt={selectedConversation.username}
                                        style={{
                                            width: '45px',
                                            height: '45px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '2px solid var(--pink-300)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => navigate(`/profile/${selectedConversation.username}`)}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <p
                                            style={{
                                                fontWeight: 700,
                                                fontSize: '18px',
                                                color: 'var(--pink-600)',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => navigate(`/profile/${selectedConversation.username}`)}
                                        >
                                            {selectedConversation.username}
                                        </p>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {selectedConversation.full_name || 'Pinktagram user'}
                                        </p>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div
                                    id="messages-container"
                                    style={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        padding: '20px',
                                        background: 'linear-gradient(to bottom, var(--pink-50) 0%, white 100%)'
                                    }}
                                >
                                    {messages.map((msg, index) => {
                                        const isOwnMessage = String(msg.sender_id) === String(currentUser.id)
                                        const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id

                                        return (
                                            <div
                                                key={msg.id}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                                                    marginBottom: '15px',
                                                    animation: 'slideUp 0.3s ease'
                                                }}
                                            >
                                                {!isOwnMessage && showAvatar && (
                                                    <img
                                                        src={msg.sender_profile_picture || 'https://via.placeholder.com/30'}
                                                        alt={msg.sender_username}
                                                        style={{
                                                            width: '30px',
                                                            height: '30px',
                                                            borderRadius: '50%',
                                                            marginRight: '10px',
                                                            border: '2px solid var(--pink-200)'
                                                        }}
                                                    />
                                                )}
                                                {!isOwnMessage && !showAvatar && <div style={{ width: '40px' }} />}

                                                <div
                                                    style={{
                                                        maxWidth: '60%',
                                                        padding: '12px 18px',
                                                        borderRadius: isOwnMessage ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                                                        background: isOwnMessage
                                                            ? 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-600) 100%)'
                                                            : 'white',
                                                        color: isOwnMessage ? 'white' : 'var(--text-primary)',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    <p style={{ fontSize: '15px', margin: 0 }}>{msg.message}</p>
                                                    <p style={{
                                                        fontSize: '11px',
                                                        marginTop: '5px',
                                                        opacity: 0.7,
                                                        textAlign: 'right'
                                                    }}>
                                                        {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Message Input */}
                                <form
                                    onSubmit={handleSendMessage}
                                    style={{
                                        padding: '20px',
                                        borderTop: '2px solid var(--pink-100)',
                                        display: 'flex',
                                        gap: '15px',
                                        background: 'white'
                                    }}
                                >
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message... 💭"
                                        style={{
                                            flex: 1,
                                            padding: '14px 20px',
                                            border: '2px solid var(--pink-200)',
                                            borderRadius: '25px',
                                            fontSize: '15px',
                                            fontFamily: 'Quicksand, sans-serif',
                                            background: 'var(--pink-50)'
                                        }}
                                        disabled={sending}
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className="btn btn-primary"
                                        style={{
                                            borderRadius: '50%',
                                            width: '50px',
                                            height: '50px',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: sending || !newMessage.trim() ? 0.5 : 1
                                        }}
                                    >
                                        <Send size={20} />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, var(--pink-50) 0%, white 100%)'
                            }}>
                                <MessageCircle size={100} style={{ color: 'var(--pink-300)', marginBottom: '20px' }} />
                                <h3 style={{ fontSize: '24px', color: 'var(--pink-600)', marginBottom: '10px' }}>
                                    Your Messages
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                                    Select a conversation to start chatting! 💗
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <Footer />
            </main>

            <style>{`
        @media (max-width: 768px) {
          .main-content > div {
            flex-direction: column !important;
            height: calc(100vh - 60px) !important;
          }
          
          .conversations-list {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 2px solid var(--pink-100) !important;
            ${selectedConversation ? 'display: none !important;' : ''}
          }
          
          .chat-area {
            ${!selectedConversation ? 'display: none !important;' : ''}
          }
          
          .mobile-back-btn {
            display: block !important;
          }
        }
      `}</style>
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

export default Messages