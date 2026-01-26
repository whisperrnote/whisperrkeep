"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  appwriteRealtime as realtime, 
  appwriteDatabases as databases,
  APPWRITE_DATABASE_ID,
  Query 
} from '@/lib/appwrite';
import { useAppwrite } from '../appwrite-provider';

interface NotificationMetadata {
  read?: boolean;
  readAt?: string;
  originalDetails?: string | null;
}

interface ActivityLog {
  $id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  details: string | null;
}

interface NotificationContextType {
  notifications: ActivityLog[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<ActivityLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAppwrite();

  const APPWRITE_TABLE_ID_ACTIVITYLOG = "activityLog";

  const parseMetadata = (details: string | null): NotificationMetadata => {
    if (!details) return { read: false, originalDetails: null };
    try {
      if (details.startsWith('{')) {
        return JSON.parse(details);
      }
    } catch (e) {}
    return { read: false, originalDetails: details };
  };

  const calculateUnread = useCallback((logs: ActivityLog[]) => {
    return logs.filter(log => !parseMetadata(log.details).read).length;
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user?.$id) return;
    
    setIsLoading(true);
    try {
      const res = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TABLE_ID_ACTIVITYLOG,
        [Query.equal('userId', user.$id), Query.orderDesc('timestamp'), Query.limit(50)]
      );
      const logs = res.documents as unknown as ActivityLog[];
      setNotifications(logs);
      setUnreadCount(calculateUnread(logs));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.$id, calculateUnread]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user?.$id) return;

    const channel = `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TABLE_ID_ACTIVITYLOG}.documents`;
    
    const unsub = realtime.subscribe(channel, (response) => {
      const payload = response.payload as ActivityLog;
      if (payload.userId !== user.$id) return;

      const isCreate = response.events.some(e => e.includes('.create'));
      const isUpdate = response.events.some(e => e.includes('.update'));

      if (isCreate) {
        setNotifications(prev => [payload, ...prev]);
        if (!parseMetadata(payload.details).read) {
          setUnreadCount(prev => prev + 1);
        }
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(`Whisperr ${payload.targetType}`, { body: payload.action });
        }
      } else if (isUpdate) {
        setNotifications(prev => {
          const updated = prev.map(n => n.$id === payload.$id ? payload : n);
          setUnreadCount(calculateUnread(updated));
          return updated;
        });
      }
    });

    return () => {
      if (typeof unsub === 'function') (unsub as any)();
      else (unsub as any).unsubscribe?.();
    };
  }, [user?.$id, calculateUnread]);

  const markAsRead = async (id: string) => {
    const notification = notifications.find(n => n.$id === id);
    if (!notification) return;

    const meta = parseMetadata(notification.details);
    if (meta.read) return;

    const newMetadata = { ...meta, read: true, readAt: new Date().toISOString() };

    try {
      setNotifications(prev => prev.map(n => n.$id === id ? { ...n, details: JSON.stringify(newMetadata) } : n));
      await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TABLE_ID_ACTIVITYLOG, id, {
        details: JSON.stringify(newMetadata)
      });
    } catch (error) {
      console.error('Cloud sync failed:', error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !parseMetadata(n.details).read);
    unread.forEach(n => markAsRead(n.$id));
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      isLoading, 
      markAsRead, 
      markAllAsRead 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}