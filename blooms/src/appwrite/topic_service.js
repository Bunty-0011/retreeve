import conf from "../conf/conf.js";
import { Client, Databases, Query } from "appwrite";

class TopicService {
  client = new Client();
  databases;

  constructor() {
    this.client
      .setEndpoint(conf.appwriteUrl)
      .setProject(conf.appwriteProjectId);

    this.databases = new Databases(this.client);
  }

  // ✅ Create a new topic (no need to provide topicId)
  async createTopic({
    title,
    notes = "",
    userId,
    status = "learning",
    lastReviewedAt = null,
    nextReviewAt = null,
  }) {
    try {
      const now = new Date();
      if (!nextReviewAt) {
        const next = new Date();
        next.setDate(now.getDate() + 1); // default to tomorrow
        nextReviewAt = next.toISOString();
      }

      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        "unique()", // ✅ let Appwrite auto-generate ID
        {
          title,
          notes,
          user_id: userId,
          created_at: now.toISOString(),
          last_reviewed_at: lastReviewedAt || now.toISOString(),
          next_review_date: nextReviewAt,
          ease_factor: 250,
          repetition_count: 0,
          interval: 1,
          status,
          test_results: [],
          weak_areas: "",
        }
      );
    } catch (error) {
      console.error("TopicService :: createTopic :: error", error);
      return false;
    }
  }

  // ✅ Get all topics for a user
  async getUserTopics(userId) {
    try {
      return await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        [Query.equal("user_id", userId)]
      );
    } catch (error) {
      console.error("TopicService :: getUserTopics :: error", error);
      return { documents: [] };
    }
  }

  // ✅ Search topics by title for a user
  async searchTopics(userId, searchText) {
    try {
      const res = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        [Query.equal("user_id", userId), Query.search("title", searchText)]
      );
      return res.documents || [];
    } catch (error) {
      console.error("TopicService :: searchTopics :: error", error);
      return [];
    }
  }

  // ✅ Get topics by status
  async getTopicsByStatus(userId, status) {
    try {
      const res = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        [Query.equal("user_id", userId), Query.equal("status", status)]
      );
      return res.documents || [];
    } catch (error) {
      console.error("TopicService :: getTopicsByStatus :: error", error);
      return [];
    }
  }

  // ✅ Get a specific topic (needs Appwrite $id)
  async getTopic(id) {
    try {
      return await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        id
      );
    } catch (error) {
      console.error("TopicService :: getTopic :: error", error);
      return null;
    }
  }

  // ✅ Update topic (title, notes, status, review dates)
  async updateTopic(id, data) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        id,
        data
      );
    } catch (error) {
      console.error("TopicService :: updateTopic :: error", error);
      return false;
    }
  }

  // ✅ Delete topic
  async deleteTopic(id) {
    try {
      return await this.databases.deleteDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        id
      );
    } catch (error) {
      console.error("TopicService :: deleteTopic :: error", error);
      return false;
    }
  }

  // ✅ Update topic status
  async updateTopicStatus(id, newStatus) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        id,
        { status: newStatus }
      );
    } catch (error) {
      console.error("TopicService :: updateTopicStatus :: error", error);
      throw error;
    }
  }
  // ✅ Get test results for a topic
  async getTestResults(topicId) {
    try {
      const topic = await this.getTopic(topicId);
      return topic?.test_results || [];
    } catch (error) {
      console.error("TopicService :: getTestResults :: error", error);
      return [];
    }
  }

  // ✅ Update topic notes
  async updateTopicNotes(id, newNotes) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        id,
        { notes: newNotes }
      );
    } catch (error) {
      console.error("TopicService :: updateTopicNotes :: error", error);
      return false;
    }
  }

  // ✅ Append a new test result (score) & update weak areas
  async appendTestResult(topicId, newScore, weakAreas = []) {
    try {
      // 1. Get existing topic doc
      const existing = await this.getTopic(topicId);
  
      // 2. Append new result
      const updatedResults = [...(existing.test_results || []), newScore];
  
      // 3. Normalize weakAreas (make sure it's always an array)
      let weakAreasArr = [];
      if (Array.isArray(weakAreas)) {
        weakAreasArr = weakAreas;
      } else if (typeof weakAreas === "string") {
        weakAreasArr = weakAreas.split(/[,;\n]+/).map((w) => w.trim()).filter(Boolean);
      }
  
      // 4. Calculate next review date (basic spaced repetition)
      const nextReview = new Date();
      const interval = existing.interval || 1;
      nextReview.setDate(nextReview.getDate() + interval);
  
      // 5. Update doc
      const updatedDoc = await this.updateTopic(topicId, {
        test_results: updatedResults,
        weak_areas: weakAreasArr.join(", "),
        last_reviewed_at: new Date().toISOString(),
        next_review_date: nextReview.toISOString(),
        repetition_count: (existing.repetition_count || 0) + 1,
      });
  
      return updatedDoc;
    } catch (error) {
      console.error("TopicService :: appendTestResult :: error", error);
      throw error;
    }
  }
  
}

const topicService = new TopicService();
export default topicService;
