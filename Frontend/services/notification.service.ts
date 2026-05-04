import apiClient from '@/lib/api';
import { Notification, PageResponse } from '@/types/notification';

export const notificationService = {
  getAll: async (page = 0, size = 20): Promise<PageResponse<Notification>> => {
    const { data } = await apiClient.get('/notifications', { params: { page, size } });
    return data;
  },
  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get('/notifications/unread/count');
    return data;
  },
  getLatestUnread: async (): Promise<Notification[]> => {
    const { data } = await apiClient.get('/notifications/unread/latest');
    return data;
  },
  markAsRead: async (id: number): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`);
  },
  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all');
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};