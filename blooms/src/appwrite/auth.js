// src/appwrite/auth.js
import { account, ID } from "./appwrite";  

export class AuthService {
    async createAccount({ email, password, name }) {
        try {
            const userAccount = await account.create(ID.unique(), email, password, name);
            if (userAccount) {
                // Auto-login after creating account
                return this.login({ email, password });
            } else {
                return userAccount;
            }
        } catch (error) {
            throw error;
        }
    }

    async login({ email, password }) {
        try {
            return await account.createEmailPasswordSession(email, password);
        } catch (error) {
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            return await account.get();
        } catch (error) {
            console.log("Appwrite service :: getCurrentUser :: error", error);
        }
        return null;
    }

    async logout() {
        try {
            await account.deleteSessions();
        } catch (error) {
            console.log("Appwrite service :: logout :: error", error);
        }
    }

    async updateAccount({ name, email, password }) {
        try {
            let result = {};

            if (name) {
                result.name = await account.updateName(name);
            }
            if (email) {
                result.email = await account.updateEmail(email, password); 
            }
            if (password) {
                result.password = await account.updatePassword(password, password); 
            }

            return result;
        } catch (error) {
            console.log("Appwrite service :: updateAccount :: error", error);
            throw error;
        }
    }
}

const authService = new AuthService();
export default authService;