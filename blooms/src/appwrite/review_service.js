import conf from "../conf/conf";
import { Databases, ID, Permission, Role, Account, Query } from "appwrite";
import { client } from "./appwrite";

const databases = new Databases(client);
const account = new Account(client);



class ReviewService {
  // =========================================================
  // Generate Test
  // =========================================================
  async generateTest(topicId) {
    try {
      const user = await account.get();
      const userId = user.$id;
      if (!topicId || !userId) throw new Error("topicId and userId are required");

      const topic = await databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        topicId
      );

      const prompt = `Generate 5 multiple-choice questions with 4 options each about the topic: "${topic.title}".
Return ONLY JSON array of objects:
[
  { "question": "string", "options": ["a","b","c","d"], "answer": "a" }
]`;
      const hfResp={};
      

      const hfData = await hfResp.json();

      let test;
      try {
        test = JSON.parse(hfData?.choices?.[0]?.text || "[]");
        if (!Array.isArray(test) || test.length === 0) throw new Error("Empty test");
      } catch {
        console.warn("⚠️ Model did not return valid JSON, fallback used.");
        test = [{ question: hfData?.choices?.[0]?.text || "No question generated", options: [], answer: "" }];
      }

      test = test.map((q, idx) => ({ id: `q${idx + 1}`, ...q }));

      // Save as stringified JSON (because collection expects String[])
      const sessionDoc = await databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteReviewSessionsCollectionId,
        ID.unique(),
        {
          user_id: userId,
          topic_id: topicId,
          questions: [JSON.stringify(test)],   // ✅ save inside string[]
          answers: [JSON.stringify([])],       // ✅ empty array inside string[]
          score: null,
          weaknesses: "",
          recommended_next_review_at: null,
          model: "enter model",
          created_at: new Date().toISOString(),
          status: "pending",
        },
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );

      return { sessionId: sessionDoc.$id, topicId, questions: test };
    } catch (err) {
      console.error("❌ generateTest failed:", err);
      throw err;
    }
  }

  // =========================================================
  // Analyze Test
  // =========================================================
  async analyzeTest(sessionId, userAnswers) {
    try {
      const user = await account.get();
      const userId = user.$id;

      const session = await databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteReviewSessionsCollectionId,
        sessionId
      );

      const questions = JSON.parse(session.questions?.[0] || "[]"); // ✅ parse back
      let correct = 0;
      questions.forEach((q) => {
        if (userAnswers[q.id] === q.answer) correct++;
      });

      const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;

      const prompt = `The user scored ${score}% on a test about "${session.topic_id}".
The test had these questions: ${JSON.stringify(questions)}.
Based on the mistakes, provide a short list of weaknesses (as a JSON array of strings).`;
      const hfResp={};
      

      const hfData = await hfResp.json();
      let weaknesses;
      try {
        let parsed = JSON.parse(hfData?.choices?.[0]?.text || "[]");
      
        if (Array.isArray(parsed)) {
          weaknesses = parsed.join(", ");   // ✅ convert array → single string
        } else {
          weaknesses = String(parsed);      // ✅ force anything else to string
        }
      } catch {
        weaknesses = hfData?.choices?.[0]?.text || "No weaknesses provided."; // ✅ fallback string
      }
      
      
      
      let nextReviewDays = 1;
      if (score >= 80) nextReviewDays = 7;
      else if (score >= 50) nextReviewDays = 3;

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + nextReviewDays);

      await databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteReviewSessionsCollectionId,
        sessionId,
        {
          answers: [JSON.stringify(userAnswers)], // ✅ store inside string[]
          score,
          weaknesses,
          recommended_next_review_at: nextReviewDate.toISOString(),
          status: "completed",
        }
      );

      return { score, weaknesses, nextReviewDate: nextReviewDate.toISOString() };
    } catch (err) {
      console.error("❌ analyzeTest failed:", err);
      throw err;
    }
  }

  async submitTest(sessionId, userAnswers) {
    return this.analyzeTest(sessionId, userAnswers);
  }

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