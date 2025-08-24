
const conf = {
    appwriteUrl:String(import.meta.env.VITE_APPWRITE_URL),
    appwriteProjectId: String(import.meta.env.VITE_APPWRITE_PROJECT_ID),
    appwriteDatabaseId: String(import.meta.env.VITE_APPWRITE_DATABASE_ID),
    appwriteCollectionId:String(import.meta.env.VITE_APPWRITE_COLLECTION_ID),
    appwriteNotificationCollectionId: String(import.meta.env.VITE_APPWRITE_NOTIFICATION_COLLECTION_ID),
    appwriteBucketId: String(import.meta.env.VITE_APPWRITE_BUCKET_ID),
    appwriteReviewSessionsCollectionId: String(import.meta.env.VITE_APPWRITE_REVIEW_SESSIONS_COLLECTION_ID),
    appwriteApiKey:import.meta.env.VITE_API_KEY,

    openApiKey:import.meta.env.OPEN_API_KEY,
    SMTP_USER: import.meta.env.VITE_SMTP_USER,
    SMTP_PASS: import.meta.env.VITE_SMTP_PASS
}

export default conf