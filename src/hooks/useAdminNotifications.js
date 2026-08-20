import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsReadSupabase,
} from "../services/adminService";

export function useAdminNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const feed = await getNotifications();
      setItems(feed);
    } catch (err) {
      console.error("Notifications admin:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.is_read).length,
    [items],
  );

  const markAsRead = useCallback(
    async (id) => {
      await markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    await markAllNotificationsReadSupabase();
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

  return {
    notifications: items,
    unreadCount,
    loading,
    refresh: load,
    markAsRead,
    markAllRead,
  };
}
