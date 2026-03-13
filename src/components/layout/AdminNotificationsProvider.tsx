"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { SerializedAdminNotification } from "@/lib/qa";

type NotificationResponse = {
  notifications: SerializedAdminNotification[];
  unreadCount: number;
  error?: string;
};

type AdminNotificationsContextValue = {
  notifications: SerializedAdminNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: (silent?: boolean) => Promise<void>;
  markAllRead: () => Promise<boolean>;
  markQuestionAsRead: (questionId: string) => Promise<boolean>;
  clearError: () => void;
};

const AdminNotificationsContext = createContext<AdminNotificationsContextValue | null>(
  null
);

interface AdminNotificationsProviderProps {
  initialNotifications: SerializedAdminNotification[];
  initialUnreadCount: number;
  children: ReactNode;
}

export function AdminNotificationsProvider({
  initialNotifications,
  initialUnreadCount,
  children,
}: AdminNotificationsProviderProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyNotificationResponse(data: NotificationResponse) {
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  }

  const refreshNotifications = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await fetch("/api/admin/notifications", {
        cache: "no-store",
      });
      const data = (await response.json()) as NotificationResponse;

      if (!response.ok) {
        if (!silent) {
          setError(data.error ?? "შეტყობინებების ჩატვირთვა ვერ მოხერხდა");
        }
        return;
      }

      applyNotificationResponse(data);
      setError(null);
    } catch {
      if (!silent) {
        setError("კავშირის შეცდომა, სცადეთ თავიდან");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshNotifications(true);
    }, 30000);

    const handleFocus = () => {
      void refreshNotifications(true);
    };
    const handleNotificationsChanged = () => {
      void refreshNotifications(true);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("notifications:changed", handleNotificationsChanged);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("notifications:changed", handleNotificationsChanged);
    };
  }, [refreshNotifications]);

  async function markAllRead() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAllRead: true }),
      });
      const data = (await response.json()) as NotificationResponse;

      if (!response.ok) {
        setError(data.error ?? "შეტყობინებების განახლება ვერ მოხერხდა");
        return false;
      }

      applyNotificationResponse(data);
      return true;
    } catch {
      setError("კავშირის შეცდომა, სცადეთ თავიდან");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function markQuestionAsRead(questionId: string) {
    if (!questionId) {
      return false;
    }

    setError(null);

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionId }),
      });
      const data = (await response.json()) as NotificationResponse;

      if (!response.ok) {
        setError(data.error ?? "კითხვის სტატუსის განახლება ვერ მოხერხდა");
        return false;
      }

      applyNotificationResponse(data);
      return true;
    } catch {
      setError("კავშირის შეცდომა, სცადეთ თავიდან");
      return false;
    }
  }

  return (
    <AdminNotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        refreshNotifications,
        markAllRead,
        markQuestionAsRead,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationsContext);

  if (!context) {
    throw new Error("useAdminNotifications must be used within AdminNotificationsProvider");
  }

  return context;
}
