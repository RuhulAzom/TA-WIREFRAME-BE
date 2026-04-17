import { createNotification } from "./create-notification";
import { createNotificationWorker } from "./create-notification-worker";
import { getNotification } from "./get-notification";
import { getNotificationCount } from "./get-notification-count";
import { getNotificationDetail } from "./get-notification-detail";
import { sendNotificationWorker } from "./send-notification-worker";
import { updateNotificationStatus } from "./update-notification-status";

export default {
  getNotification, createNotification, getNotificationDetail, getNotificationCount, updateNotificationStatus, createNotificationWorker, sendNotificationWorker
};
