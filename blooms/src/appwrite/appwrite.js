// src/appwrite/appwrite.js
import { Client,Functions, Account, Databases, ID, Query } from "appwrite";
import conf from "../conf/conf";

// Create a single shared Appwrite client
const client = new Client()
  .setEndpoint(conf.appwriteUrl)        // e.g. "https://cloud.appwrite.io/v1"
  .setProject(conf.appwriteProjectId); // your project ID

// Services tied to this client
const account = new Account(client);
const databases = new Databases(client);
const functions = new Functions(client);
// Export everything needed across app
export { client, functions, account, databases, ID, Query };
