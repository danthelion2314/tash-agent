import { db } from "@/lib/firebase";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where
} from "firebase/firestore";
import { RequestTemplate } from "@/types/schema";

const COLLECTION_NAME = "requestTemplates";

export const TashService = {
    // 1. שליפת כל התבניות (עבור הקטלוג וההגדרות)
    getAllTemplates: async (): Promise<RequestTemplate[]> => {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            return querySnapshot.docs.map(doc => doc.data() as RequestTemplate);
        } catch (error) {
            console.error("Error fetching templates:", error);
            return [];
        }
    },

    // 2. שליפת תבנית ספציפית לפי ID
    getTemplateById: async (id: string): Promise<RequestTemplate | null> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as RequestTemplate;
            }
            return null;
        } catch (error) {
            console.error("Error fetching template:", error);
            return null;
        }
    },

    // 3. יצירה או דריסה של תבנית (משמש בעיקר את ה-Seed)
    upsertTemplate: async (template: RequestTemplate) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, template.id);
            await setDoc(docRef, {
                ...template,
                lastUpdated: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error("Error saving template:", error);
            throw error;
        }
    },

    // 4. עדכון תבנית קיימת (הפונקציה שהייתה חסרה לעורך)
    updateTemplate: async (id: string, updates: Partial<RequestTemplate>) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...updates,
                lastUpdated: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error("Error updating template:", error);
            throw error;
        }
    }
};