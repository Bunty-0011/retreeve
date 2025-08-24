import { Client, Databases, ID, Query } from "appwrite";
import conf from "../conf/conf.js";

export class SpacedRepetitionService {
    client = new Client();
    databases;
    databaseId = conf.appwriteDatabaseId;
    collectionId = conf.appwriteCollectionId;

    constructor() {
        this.client
            .setEndpoint(conf.appwriteUrl)
            .setProject(conf.appwriteProjectId);
        this.databases = new Databases(this.client);
    }

    // ===== Helper Functions =====
    getNextReviewDate(lastReviewed, interval) {
        const date = new Date(lastReviewed);
        date.setDate(date.getDate() + interval);
        return date;
    }

    getStatus(lastReviewed, nextReview) {
        const now = new Date();
        if (nextReview <= now) return "due";
        const diff = (nextReview - now) / (1000 * 60 * 60 * 24);
        if (diff <= 1) return "learning";
        if (diff <= 7) return "reviewing";
        return "mastered";
    }

    // ===== New Method to Fetch All Topics for a User =====
    async getUserTopics(userId) {
        try {
            const res = await this.databases.listDocuments(
                this.databaseId,
                this.collectionId,
                [Query.equal("user_id", userId)]
            );

            const mapped = res.documents.map(doc => {
                const lastReviewed = doc.last_reviewed_at
                    ? new Date(doc.last_reviewed_at)
                    : new Date();

                const nextReview = this.getNextReviewDate(lastReviewed, doc.interval || 1);

                return {
                    ...doc,
                    lastReviewed: lastReviewed.toLocaleDateString(),
                    nextReviewDate: nextReview.toLocaleDateString(),
                    status: this.getStatus(lastReviewed, nextReview)
                };
            });

            // Sort by next review date
            mapped.sort((a, b) => new Date(a.nextReviewDate) - new Date(b.nextReviewDate));

            return mapped;
        } catch (error) {
            console.error("Error fetching user topics:", error);
            return [];
        }
    }

    async getDueTopics(userId) {
        const today = new Date().toISOString();
        try {
            const response = await this.databases.listDocuments(
                this.databaseId,
                this.collectionId,
                [
                    Query.equal("user_id", userId),
                    Query.lessEqual("next_review_date", today)
                ]
            );
            return response.documents;
        } catch (error) {
            console.error("Error fetching due topics:", error);
            return [];
        }
    }

    async saveTestResult(topicId, score) {
        try {
            const topic = await this.getTopic(topicId);
            const testResults = topic.test_results || [];
            testResults.push(score);

            return await this.databases.updateDocument(
                this.databaseId,
                this.collectionId,
                topicId,
                { test_results: testResults }
            );
        } catch (error) {
            console.error("Error saving test score:", error);
        }
    }

    async markAsMastered(topicId) {
        try {
            return await this.databases.updateDocument(
                this.databaseId,
                this.collectionId,
                topicId,
                { status: "mastered" }
            );
        } catch (error) {
            console.error("Error marking topic as mastered:", error);
        }
    }

    async unmarkAsMastered(topicId) {
        try {
            return await this.databases.updateDocument(
                this.databaseId,
                this.collectionId,
                topicId,
                { status: "learning" }
            );
        } catch (error) {
            console.error("Error marking topic as learning:", error);
        }
    }

    async markAsImportant(topicId) {
        try {
            return await this.databases.updateDocument(
                this.databaseId,
                this.collectionId,
                topicId,
                { important: true }
            );
        } catch (error) {
            console.error("Error marking topic as important:", error);
        }
    }

    async unmarkAsImportant(topicId) {
        try {
            return await this.databases.updateDocument(
                this.databaseId,
                this.collectionId,
                topicId,
                { important: false }
            );
        } catch (error) {
            console.error("Error marking topic as not important:", error);
        }
    }

    async reviewTopic(topicId, quality = 4) {
        try {
            const topic = await this.databases.getDocument(
                this.databaseId,
                this.collectionId,
                topicId
            );

            const now = new Date();
            const interval = topic.interval || 1;
            const easeFactor = (topic.ease_factor || 250) / 100;
            const repetitions = topic.repetition_count || 0;

            let newEase = easeFactor;
            let newInterval = interval;
            let newRepetitions = repetitions;

            if (quality >= 3) {
                newRepetitions += 1;
                newInterval =
                    newRepetitions === 1
                        ? 1
                        : newRepetitions === 2
                        ? 6
                        : Math.round(newInterval * easeFactor);
                newEase = Math.max(
                    1.3,
                    easeFactor +
                        (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
                );
            } else {
                newRepetitions = 0;
                newInterval = 1;
                newEase = Math.max(1.3, easeFactor - 0.2);
            }

            const nextReviewDate = new Date();
            nextReviewDate.setDate(now.getDate() + newInterval);

            const updated = await this.databases.updateDocument(
                this.databaseId,
                this.collectionId,
                topicId,
                {
                    last_reviewed_at: now.toISOString(),
                    next_review_date: nextReviewDate.toISOString(),
                    ease_factor: Math.round(newEase * 100),
                    repetition_count: newRepetitions,
                    interval: newInterval
                }
            );

            return updated;
        } catch (error) {
            console.error("Error updating topic after review:", error);
        }
    }
}

const spacedService = new SpacedRepetitionService();
export default spacedService;
