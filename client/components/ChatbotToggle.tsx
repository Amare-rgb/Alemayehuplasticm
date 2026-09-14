// components/ChatbotToggle.tsx
'use client';

import React, { useState, useEffect, useCallback, FC, useRef } from 'react';
import { useAuth } from '@/app/providers';
import Chatbot from './Chatbot';

interface ChatbotToggleProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark' | 'auto';
}

const ChatbotToggle: FC<ChatbotToggleProps> = ({
  position = 'bottom-right',
  theme = 'auto',
}) => {
  const { user, status } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isFetchingRef = useRef<boolean>(false);

  // ============== FETCH UNREAD COUNT ==============
  const fetchUnreadCount = useCallback(async (): Promise<void> => {
    // Guard: don't fire if unmounted or already fetching
    if (isFetchingRef.current || !isMountedRef.current) return;

    // Guard: don't fire if no token (avoids 401 + "Failed to fetch" spam)
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('token') ||
          localStorage.getItem('authToken') ||
          sessionStorage.getItem('token') ||
          sessionStorage.getItem('authToken')
        : null;

    if (!token) return;

    isFetchingRef.current = true;

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      // AbortController prevents hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${apiUrl}/api/chatbot/unread/count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!isMountedRef.current) return;

      // Non-OK responses are expected when the route doesn't exist yet —
      // log softly, don't throw.
      if (!response.ok) {
        if (response.status !== 404 && response.status !== 401) {
          console.warn(
            `[ChatbotToggle] unread/count returned ${response.status}`
          );
        }
        return;
      }

      const data = await response.json();

      // Support several possible shapes: { count }, { unreadCount }, { data: { unreadCount } }
      const count =
        typeof data?.count === 'number'
          ? data.count
          : typeof data?.unreadCount === 'number'
          ? data.unreadCount
          : typeof data?.data?.unreadCount === 'number'
          ? data.data.unreadCount
          : 0;

      if (!isOpen && isMountedRef.current) {
        setUnreadCount(count);
      }
    } catch (error) {
      // ✅ Silently swallow network/abort errors — this is the actual fix
      // for the "Failed to fetch" console crash.
      if (
        error instanceof Error &&
        error.name !== 'AbortError' &&
        !error.message.includes('Failed to fetch') &&
        !error.message.includes('NetworkError')
      ) {
        console.warn('[ChatbotToggle] fetchUnreadCount error:', error.message);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [isOpen]);

  // ============== START INTERVAL ==============
  const startInterval = useCallback((): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    fetchUnreadCount();

    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
  }, [fetchUnreadCount]);

  // ============== STOP INTERVAL ==============
  const stopInterval = useCallback((): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ============== SETUP INTERVAL ON CHANGE ==============
  useEffect(() => {
    isMountedRef.current = true;
    let timerId: NodeJS.Timeout | undefined;

    if (!isOpen) {
      timerId = setTimeout(() => {
        if (isMountedRef.current) {
          startInterval();
        }
      }, 0);
    } else {
      stopInterval();
    }

    return () => {
      if (timerId) clearTimeout(timerId);
      stopInterval();
    };
  }, [isOpen, startInterval, stopInterval]);

  // ============== CLEANUP ON UNMOUNT ==============
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      isFetchingRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // ============== RESET UNREAD ON CHAT OPEN ==============
  useEffect(() => {
    if (isOpen && isMountedRef.current) {
      setUnreadCount(0);
      stopInterval();
    }
  }, [isOpen, stopInterval]);

  // ============== TOGGLE CHAT ==============
  const toggleChat = useCallback((): void => {
    setIsOpen((prev) => !prev);
  }, []);

  // Public chat — no login required to open the widget.
  // (Unread count simply won't fire if there's no token.)

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        className={`
          fixed bottom-6 right-4 sm:right-6 md:right-8 z-50
          w-14 h-14 rounded-full shadow-2xl
          flex items-center justify-center
          transition-all duration-300 transform
          ${
            isOpen
              ? 'bg-red-500 hover:bg-red-600 rotate-90'
              : 'bg-gradient-to-r from-green-700 to-green-500 hover:from-green-600 hover:to-green-400 hover:scale-110 hover:shadow-green-500/25'
          }
          text-white text-2xl
          group
        `}
      >
        {isOpen ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}

        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[24px] h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 animate-bounce border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chatbot Component */}
      <Chatbot
        isOpen={isOpen}
        onToggle={toggleChat}
        position={position}
        theme={theme}
      />
    </>
  );
};

export default ChatbotToggle;