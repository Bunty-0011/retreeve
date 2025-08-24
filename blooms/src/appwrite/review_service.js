import conf from "../conf/conf";
import { Databases, ID, Permission, Role, Account, Query } from "appwrite";
import { client } from "./appwrite";

const databases = new Databases(client);
const account = new Account(client);



class ReviewService {
  // =========================================================
  // Generate Test
  // =========================================================


  // =========================================================
  // Update Review Data (used when clicking TopicCard / status change)
  // =========================================================
  async updateReviewData(topicId, userId, options = {}) {
    try {
      const topic = await databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        topicId
      );
  
      if (topic.user_id !== userId) {
        throw new Error("You are not allowed to update this topic.");
      }
  
      const now = new Date();
      const nowISO = now.toISOString();
      let repetition_count = topic.repetition_count || 0;
      let testResult = null;
  
      // === Save review session if test taken ===
      if (options.giveTest) {
        testResult = getDummyTestResult(options.score || 50);
  
        await databases.createDocument(
          conf.appwriteDatabaseId,
          conf.appwriteReviewSessionsCollectionId,
          ID.unique(),
          {
            topic_id: topicId,
            user_id: userId,
            score: testResult.score,
            pass: testResult.pass,
            weaknesses: testResult.weaknesses,
            recommended_next_review_at: testResult.recommended_next_review_at,
            created_at: nowISO,
          },
          [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ]
        );
      }
  
      // --- Ease factor & interval defaults ---
      let ease_factor = (topic.ease_factor || 250) / 100;
      let interval = 1;
  
      // === Manual status override ===
      if (options.status) {
        if (options.status === "mastered") {
          ease_factor = 3.0;
          interval = 30;
          repetition_count = 10;
        } else if (options.status === "learning") {
          ease_factor = 2.0;
          interval = 3;
          repetition_count = 3;
        } else if (options.status === "forgotten") {
          ease_factor = 1.3;
          interval = 1;
          repetition_count = 0;
        }
      } else {
        // === Auto spaced repetition ===
        repetition_count += 1;
  
        if (topic.next_review_date && new Date(topic.next_review_date) < now) {
          const daysOverdue = Math.floor(
            (now - new Date(topic.next_review_date)) / (1000 * 60 * 60 * 24)
          );
          ease_factor = Math.max(1.3, ease_factor - 0.2 * daysOverdue);
          if (daysOverdue >= 7) {
            options.status = "forgotten";
          }
        }
  
        if (testResult) {
          if (testResult.pass) {
            ease_factor = Math.max(
              1.3,
              ease_factor + 0.1 + repetition_count * 0.05
            );
            
          } else {
            ease_factor = Math.max(1.3, ease_factor - 0.2);
          }
        } else {
          ease_factor = Math.max(1.3, 2.5 + repetition_count * 0.05);
        }
  
        if (repetition_count === 1) interval = 1;
        else if (repetition_count === 2) interval = 6;
        else interval = Math.round((topic.interval || 1) * ease_factor);
      }
  
      // --- Next review date ---
      let nextReviewDate;
      if (testResult) {
        // ✅ Always prefer test recommendation if test was given
        if (testResult.score < 40) {
          // ❌ Force early retry if test failed badly
          nextReviewDate = new Date(now);
          nextReviewDate.setDate(nextReviewDate.getDate() + 1);
        } else {
          nextReviewDate = new Date(testResult.recommended_next_review_at);
        }
      } else if (options.status) {
        // ✅ If no test, but status manually set → use status interval
        nextReviewDate = new Date(now);
        nextReviewDate.setDate(nextReviewDate.getDate() + interval);
      } else {
        // ✅ Otherwise spaced repetition
        nextReviewDate = new Date(now);
        nextReviewDate.setDate(nextReviewDate.getDate() + interval);
      }
  
      // --- Status assignment ---
      let status = options.status;
      if (!status) {
        if (ease_factor >= 3.0) status = "mastered";
        else if (ease_factor >= 2.0) status = "learning";
        else status = "forgotten";
      }
  
      const easeFactorToSave = Math.round(ease_factor * 100);
  
      // ✅ Update topic with new spaced repetition data
      return await databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        topicId,
        {
          last_reviewed_at: nowISO,
          next_review_date: nextReviewDate.toISOString(),
          ease_factor: easeFactorToSave,
          repetition_count,
          interval,
          status,
        }
      );
    } catch (error) {
      console.error("❌ Error updating review data:", error);
      throw error;
    }
  }
  
  
}  

const reviewService = new ReviewService();
export default reviewService;