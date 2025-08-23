const conf = {
    appwriteUrl:String(import.meta.env.VITE_APPWRITE_URL),
    appwriteProjectId: String(import.meta.env.VITE_APPWRITE_PROJECT_ID),
    appwriteDatabaseId: String(import.meta.env.VITE_APPWRITE_DATABASE_ID),
    appwriteCollectionId:String(import.meta.env.VITE_APPWRITE_COLLECTION_ID),
    token : import.meta.env.VITE_HUGGINGFACE_TOKEN,
    appwriteReviewSessionsCollectionId: String(import.meta.env.VITE_APPWRITE_REVIEW_SESSIONS_COLLECTION_ID),
    appwriteApiKey:import.meta.env.VITE_API_KEY,

    
}

export default conf