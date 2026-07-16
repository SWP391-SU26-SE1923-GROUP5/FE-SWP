'use server'

import { INotificationService } from "@/types";
import { LocalNotification } from "./providers/local.notification";

const getNotificationProvider = (): INotificationService => {
    return new LocalNotification();
};

const notificationProvider = getNotificationProvider();

export const getMyNotifications = notificationProvider.getMyNotifications.bind(notificationProvider);
export const markNotificationAsRead = notificationProvider.markAsRead.bind(notificationProvider);
export const markAllNotificationsAsRead = notificationProvider.markAllAsRead.bind(notificationProvider);