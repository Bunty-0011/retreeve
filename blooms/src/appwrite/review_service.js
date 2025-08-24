import conf from "../conf/conf";
import { Databases, ID, Permission, Role, Account, Query } from "appwrite";
import { client } from "./appwrite";

const databases = new Databases(client);
const account = new Account(client);

async function callOllama(prompt) {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3.1:8b",
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

class ReviewService {
  // Generate Test method using Ollama
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

      const ollamaData = await callOllama(prompt);
    
      let test;
      try {
        test = JSON.parse((ollamaData.response).json() || "[]");
        if (!Array.isArray(test) || test.length === 0) throw new Error("Empty test");
      } catch {
        console.warn("⚠️ Model did not return valid JSON, fallback used.");
        test = [{ question: ollamaData.response || "No question generated", options: [], answer: "" }];
      }

      test = test.map((q, idx) => ({ id: `q${idx + 1}`, ...q }));

      const sessionDoc = await databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteReviewSessionsCollectionId,
        ID.unique(),
        {
          user_id: userId,
          topic_id: topicId,
          questions: [JSON.stringify(test)],
          answers: [JSON.stringify([])],
          score: null,
          weaknesses: "",
          recommended_next_review_at: null,
          model: "llama3.1:8b",
          created_at: new Date().toISOString(),
          status: "pending",
          test_type: "general",
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

  // Generate Test for specific weakness
  async generateWeaknessTest(weakness, topicId) {
    try {
      const user = await account.get();
      const userId = user.$id;
      if (!weakness || !topicId || !userId) 
        throw new Error("weakness, topicId and userId are required");

      const topic = await databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        topicId
      );

      const prompt = `Generate 5 multiple-choice questions with 4 options each specifically focusing on this weakness: "${weakness}" in the context of the topic: "${topic.title}".
The questions should directly address and test knowledge about this specific weakness area.
Return ONLY JSON array of objects:
[
  { "question": "string", "options": ["a","b","c","d"], "answer": "a" }
]`;

      const ollamaData = await callOllama(prompt);

      let test;
      try {
        test = JSON.parse(ollamaData.response || "[]");
        if (!Array.isArray(test) || test.length === 0) throw new Error("Empty test");
      } catch {
        console.warn("⚠️ Model did not return valid JSON, fallback used.");
        test = [{ question: ollamaData.response || "No question generated", options: [], answer: "" }];
      }

      test = test.map((q, idx) => ({ id: `q${idx + 1}`, ...q }));

      const sessionDoc = await databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteReviewSessionsCollectionId,
        ID.unique(),
        {
          user_id: userId,
          topic_id: topicId,
          questions: [JSON.stringify(test)],
          answers: [JSON.stringify([])],
          score: null,
          weaknesses: "",
          recommended_next_review_at: null,
          model: "llama3.1:8b",
          created_at: new Date().toISOString(),
          status: "pending",
          test_type: "weakness",
          target_weakness: weakness,
          points_claimable: 0,
        },
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );

      return { sessionId: sessionDoc.$id, topicId, questions: test, weakness };
    } catch (err) {
      console.error("❌ generateWeaknessTest failed:", err);
      throw err;
    }
  }

  // Analyze Test method using Ollama
  async analyzeTest(sessionId, userAnswers) {
    try {
      const user = await account.get();
      const userId = user.$id;

      const session = await databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteReviewSessionsCollectionId,
        sessionId
      );

      const questions = JSON.parse(session.questions?.[0] || "[]");
      let correct = 0;
      questions.forEach((q) => {
        if (userAnswers[q.id] === q.answer) correct++;
      });

      const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;

      const prompt = `The user scored ${score}% on a test about "${session.topic_id}".
The test had these questions: ${JSON.stringify(questions)}.
Based on the mistakes, provide a short list of weaknesses (as a JSON array of strings).`;

      const ollamaData = await callOllama(prompt);

      let weaknesses;
      try {
        let parsed = JSON.parse(ollamaData.response || "[]");

        if (Array.isArray(parsed)) {
          weaknesses = parsed.join(", ");
        } else {
          weaknesses = String(parsed);
        }
      } catch {
        weaknesses = ollamaData.response || "No weaknesses provided.";
      }

      let nextReviewDays = 1;
      if (score >= 80) nextReviewDays = 7;
      else if (score >= 50) nextReviewDays = 3;

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + nextReviewDays);

      // Calculate points for weakness tests
      let pointsEarned = 0;
      let pointsClaimable = 0;
      
      if (session.test_type === "weakness" && score > 50) {
        pointsEarned = Math.floor(score / 10) * 5; // 5 points per 10% above 50%
        pointsClaimable = pointsEarned;
      }

      await databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteReviewSessionsCollectionId,
        sessionId,
        {
          answers: [JSON.stringify(userAnswers)],
          score,
          weaknesses,
          recommended_next_review_at: nextReviewDate.toISOString(),
          status: "completed",
          points_earned: pointsEarned,
          points_claimable: pointsClaimable,
        }
      );

      return { 
        score, 
        weaknesses, 
        nextReviewDate: nextReviewDate.toISOString(),
        pointsEarned,
        pointsClaimable,
        isWeaknessTest: session.test_type === "weakness",
        targetWeakness: session.target_weakness,
        sessionId: sessionId,
      };
    } catch (err) {
      console.error("❌ analyzeTest failed:", err);
      throw err;
    }
  }

  async submitTest(sessionId, userAnswers) {
    return this.analyzeTest(sessionId, userAnswers);
  }

  // Claim points from a completed weakness test
  async claimPoints(sessionId) {
    try {
      const user = await account.get();
      const userId = user.$id;

      const session = await databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteReviewSessionsCollectionId,
        sessionId
      );

      if (session.user_id !== userId) {
        throw new Error("You are not allowed to claim points for this session.");
      }

      if (session.points_claimable <= 0) {
        throw new Error("No points available to claim for this session.");
      }

      if (session.points_claimed) {
        throw new Error("Points have already been claimed for this session.");
      }

      // Update session to mark points as claimed
      await databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteReviewSessionsCollectionId,
        sessionId,
        {
          points_claimed: true,
          points_claimed_at: new Date().toISOString(),
        }
      );

      // Update user's total points (assuming you have a user points field)
      try {
        const userDoc = await databases.getDocument(
          conf.appwriteDatabaseId,
          conf.appwriteUsersCollectionId, // You'll need to add this collection ID to conf
          userId
        );

        const currentPoints = userDoc.total_points || 0;
        await databases.updateDocument(
          conf.appwriteDatabaseId,
          conf.appwriteUsersCollectionId,
          userId,
          {
            total_points: currentPoints + session.points_claimable,
          }
        );
      } catch (userUpdateError) {
        console.warn("Could not update user points:", userUpdateError);
        // Continue anyway as the main operation succeeded
      }

      return { 
        pointsClaimed: session.points_claimable,
        sessionId 
      };
    } catch (err) {
      console.error("❌ claimPoints failed:", err);
      throw err;
    }
  }

  // Get user's weaknesses from completed review sessions
  async getUserWeaknesses(userId, topicId = null) {
    try {
      const query = [
        Query.equal("user_id", userId),
        Query.equal("status", "completed"),
      ];
      
      if (topicId) {
        query.push(Query.equal("topic_id", topicId));
      }

      const sessions = await databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteReviewSessionsCollectionId,
        query
      );

      const weaknessesMap = new Map();

      sessions.documents.forEach(session => {
        if (session.weaknesses && session.weaknesses.trim()) {
          const sessionWeaknesses = session.weaknesses.split(', ');
          sessionWeaknesses.forEach(weakness => {
            const trimmedWeakness = weakness.trim();
            if (trimmedWeakness) {
              if (!weaknessesMap.has(trimmedWeakness)) {
                weaknessesMap.set(trimmedWeakness, {
                  weakness: trimmedWeakness,
                  count: 0,
                  topicId: session.topic_id,
                  lastSeen: session.created_at,
                  averageScore: 0,
                  totalScore: 0,
                  sessionCount: 0
                });
              }
              
              const weaknessData = weaknessesMap.get(trimmedWeakness);
              weaknessData.count += 1;
              weaknessData.totalScore += session.score || 0;
              weaknessData.sessionCount += 1;
              weaknessData.averageScore = Math.round(weaknessData.totalScore / weaknessData.sessionCount);
              
              if (new Date(session.created_at) > new Date(weaknessData.lastSeen)) {
                weaknessData.lastSeen = session.created_at;
              }
            }
          });
        }
      });

      return Array.from(weaknessesMap.values())
        .sort((a, b) => b.count - a.count); // Sort by frequency
    } catch (err) {
      console.error("❌ getUserWeaknesses failed:", err);
      throw err;
    }
  }

  // Update Review Data (used when clicking TopicCard / status change)
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
            test_type: "general",
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

// Helper function for dummy test result (you might want to remove this if not needed)
function getDummyTestResult(score) {
  return {
    score,
    pass: score >= 60,
    weaknesses: score < 60 ? "Need more practice" : "Good understanding",
    recommended_next_review_at: new Date(Date.now() + (score >= 80 ? 7 : 3) * 24 * 60 * 60 * 1000).toISOString(),
  };
}

const reviewService = new ReviewService();
export default reviewService;
