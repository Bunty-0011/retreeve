// appwrite/test_service.js
import { ID, Databases, Permission, Role } from "appwrite";
import conf from "../conf/conf";
import { client } from "./appwrite";
import reviewService from "./review_service"; // ✅ import updater

const databases = new Databases(client);

// ✅ Dummy generator
export function getDummyTestResult(score = 50) {
  const weaknesses = score < 50 ? ["Key concepts missing"] : [];
  const recommendedNextReview = new Date();
  recommendedNextReview.setDate(
    recommendedNextReview.getDate() + (score >= 70 ? 7 : 2)
  );

  return {
    score,
    pass: score >= 50,
    weaknesses,
    recommended_next_review_at: recommendedNextReview.toISOString(),
  };
}

// ✅ Submit a test result (logs + updates topic)
export async function submitTestResult(user, topicId, score = 50) {
  const testResult = getDummyTestResult(score);

  // 1️⃣ Save history in review_sessions
  await databases.createDocument(
    conf.appwriteDatabaseId,
    conf.appwriteReviewSessionsCollectionId, // review_sessions
    ID.unique(),
    {
      topic_id: topicId,
      user_id: user.$id,
      score: testResult.score,
      weaknesses: testResult.weaknesses,
      recommended_next_review_at: testResult.recommended_next_review_at,
      created_at: new Date().toISOString(),
    },
    [
      Permission.read(Role.user(user.$id)),
      Permission.update(Role.user(user.$id)),
      Permission.delete(Role.user(user.$id)),
    ]
  );

  // 2️⃣ Update topic’s review state
  await reviewService.updateReviewData(user, topicId, testResult);

  return testResult; // ✅ return so caller can show result
}