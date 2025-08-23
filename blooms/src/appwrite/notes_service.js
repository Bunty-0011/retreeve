// src/appwrite/notes_service.js
import conf from "../conf/conf.js";
import { Client, Databases } from "appwrite";

class NotesService {
  client = new Client();
  databases;

  constructor() {
    this.client.setEndpoint(conf.appwriteUrl).setProject(conf.appwriteProjectId);
    this.databases = new Databases(this.client);
  }

  // Fetch topic document and return its notes (HTML string)
  async getNotes(topicId) {
    const topic = await this.databases.getDocument(
      conf.appwriteDatabaseId,
      conf.appwriteCollectionId, // <-- use your Topics collection id here
      topicId
    );
    return { notes: topic.notes || "", topic };
  }

  // Update the notes string on the topic
  async saveNotes(topicId, notesHtml) {
    return await this.databases.updateDocument(
      conf.appwriteDatabaseId,
      conf.appwriteCollectionId, // <-- use your Topics collection id here
      topicId,
      { notes: notesHtml }
    );
  }
}

const notesService = new NotesService();
export default notesService;