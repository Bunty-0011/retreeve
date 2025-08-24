// src/appwrite/notification_service.js
import { client, databases } from "./appwrite";
import conf from "../conf/conf";
import { ID, Query, Permission, Role } from "appwrite";

// Create a new notification for a specific user
export async function createNotification(userId, message) {
  const doc = await databases.createDocument(
    conf.appwriteDatabaseId,
    conf.appwriteNotificationCollectionId, // ✅ correct collection
    ID.unique(),
    { message, userId, isRead: false },
    [Permission.read(Role.user(userId)), Permission.write(Role.user(userId))]
  );
  return doc;
}

// Get notifications for a specific user
export async function getUserNotifications(userId, onlyUnread = false) {
  const filters = [Query.equal("userId", userId)];
  if (onlyUnread) filters.push(Query.equal("isRead", false));

  const res = await databases.listDocuments(
    conf.appwriteDatabaseId,
    conf.appwriteNotificationCollectionId, // ✅ fixed
    filters
  );
  return res.documents;
}

// Mark one notification as read
export async function markAsRead(notificationId) {
  return databases.updateDocument(
    conf.appwriteDatabaseId,
    conf.appwriteNotificationCollectionId, // ✅ fixed
    notificationId,
    { isRead: true }
  );
}

// Realtime subscribe for that user
export function subscribeToNotifications(userId, callback) {
  return client.subscribe(
    `databases.${conf.appwriteDatabaseId}.collections.${conf.appwriteNotificationCollectionId}.documents`, // ✅ fixed
    (evt) => {
      const doc = evt.payload;
      if (doc.userId === userId) {
        callback(doc);
      }
    }
  );
}
