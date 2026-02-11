import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Messages from './pages/Messages'
import Search from './pages/Search'
import api from './services/api'
import './App.css'

function App() {
    const [currentUser, setCurrentUser] = useState(null)
    const [authLoading, setAuthLoading] = useState(true) // Start loading until validated

    // On startup: validate stored user against the database
    useEffect(() => {
        const validateStoredUser = async () => {
            const storedUser = localStorage.getItem('user')

            if (!storedUser) {
                // No user stored → not logged in
                setCurrentUser(null)
                setAuthLoading(false)
                return
            }

            try {
                const parsedUser = JSON.parse(storedUser)

                if (!parsedUser?.id || !parsedUser?.username) {
                    // Corrupted data → clear and redirect to login
                    throw new Error('Invalid user data')
                }

                // Validate: check if this user still exists in database
                const response = await api.getUserByUsername(
                    parsedUser.username,
                    parsedUser.id
                )

                if (response.data?.user) {
                    // ✅ User exists in DB → restore session with fresh data
                    const freshUser = {
                        ...parsedUser,
                        ...response.data.user // Merge with latest DB data
                    }
                    setCurrentUser(freshUser)
                    localStorage.setItem('user', JSON.stringify(freshUser))
                } else {
                    throw new Error('User not found in database')
                }
            } catch (err) {
                console.warn('Session validation failed, clearing localStorage:', err.message)
                // ❌ User not found or error → clear stale data, go to login
                localStorage.removeItem('user')
                localStorage.removeItem('token')
                setCurrentUser(null)
            } finally {
                setAuthLoading(false)
            }
        }

        validateStoredUser()
    }, [])

    const handleLogin = (userData) => {
        setCurrentUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
    }

    const handleLogout = () => {
        setCurrentUser(null)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
    }

    // Show a loading spinner while we validate the session
    if (authLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, var(--pink-50) 0%, white 100%)',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-600) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    animation: 'pulse 1.5s ease infinite'
                }}>
                    💗
                </div>
                <p style={{
                    color: 'var(--pink-500)',
                    fontWeight: 600,
                    fontSize: '16px'
                }}>
                    Loading Pinktagram...
                </p>
            </div>
        )
    }

    return (
        <Router>
            <Routes>
                {/* Public routes - redirect to home if already logged in */}
                <Route
                    path="/login"
                    element={currentUser
                        ? <Navigate to="/" replace />
                        : <Login onLogin={handleLogin} />
                    }
                />
                <Route
                    path="/register"
                    element={currentUser
                        ? <Navigate to="/" replace />
                        : <Register onLogin={handleLogin} />
                    }
                />

                {/* Protected routes - redirect to login if not logged in */}
                <Route
                    path="/"
                    element={currentUser
                        ? <Home currentUser={currentUser} onLogout={handleLogout} />
                        : <Navigate to="/login" replace />
                    }
                />
                <Route
                    path="/profile/:username"
                    element={currentUser
                        ? <Profile currentUser={currentUser} onLogout={handleLogout} />
                        : <Navigate to="/login" replace />
                    }
                />
                <Route
                    path="/messages"
                    element={currentUser
                        ? <Messages currentUser={currentUser} onLogout={handleLogout} />
                        : <Navigate to="/login" replace />
                    }
                />
                <Route
                    path="/messages/:username"
                    element={currentUser
                        ? <Messages currentUser={currentUser} onLogout={handleLogout} />
                        : <Navigate to="/login" replace />
                    }
                />
                <Route
                    path="/search"
                    element={currentUser
                        ? <Search currentUser={currentUser} onLogout={handleLogout} />
                        : <Navigate to="/login" replace />
                    }
                />

                {/* Catch-all redirect */}
                <Route
                    path="*"
                    element={<Navigate to={currentUser ? "/" : "/login"} replace />}
                />
            </Routes>
        </Router>
    )
}

export default App