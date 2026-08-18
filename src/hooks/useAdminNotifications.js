import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminNotificationFeed } from "../services/adminService";
import {
  CONFIG_EVENTS,
  getReadNotificationIds,
  markAllNotificationsRead,
  markNotificationIdsRead,
} from "../utils/platformConfig";

export function useAdminNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(getReadNotificationIds);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const feed = await getAdminNotificationFeed();
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
    const syncRead = () => setReadIds(getReadNotificationIds());
    window.addEventListener(CONFIG_EVENTS.CHANGED, syncRead);
    return () => window.removeEventListener(CONFIG_EVENTS.CHANGED, syncRead);
  }, [load]);

  const enriched = useMemo(
    () =>
      items.map((n) => ({
        ...n,
        read: readIds.includes(n.id),
      })),
    [items, readIds],
  );

  const unreadCount = useMemo(
    () => enriched.filter((n) => !n.read).length,
    [enriched],
  );

  const markAsRead = useCallback((id) => {
    markNotificationIdsRead([id]);
    setReadIds(getReadNotificationIds());
  }, []);

  const markAllRead = useCallback(() => {
    markAllNotificationsRead(items.map((n) => n.id));
    setReadIds(getReadNotificationIds());
  }, [items]);

  return {
    notifications: enriched,
    unreadCount,
    loading,
    refresh: load,
    markAsRead,
    markAllRead,
  };
}
