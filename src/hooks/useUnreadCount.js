import { useState, useEffect } from 'react';
import api from '../services/api';

// Export as BOTH named and default to support both import styles
export function useUnreadCount(currentUser) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser?.id) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const response = await api.getUnreadCount(currentUser.id);
        setUnreadCount(response.data.unread_count || 0);
      } catch (err) {
        // Silently fail - unread count is non-critical
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  return unreadCount;
}

export default useUnreadCount;
