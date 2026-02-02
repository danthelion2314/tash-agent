import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { RequestTemplate } from '@/types/schema';

function getAdminDb() {
    if (!admin.apps.length) {
        try {
            // נסיון לטעון מקובץ לוקאלי
            const serviceAccount = require('../../service-account-key.json');
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } catch (e) {
            console.error("Service account load failed, trying default auth...", e);
            // Fallback לסביבת ענן
            if (process.env.FIREBASE_PROJECT_ID) {
                admin.initializeApp();
            }
        }
    }
    return getFirestore();
}

const adminDb = getAdminDb();

export async function getAllTemplatesForAI(): Promise<RequestTemplate[]> {
    const snapshot = await adminDb.collection('requestTemplates').get();

    return snapshot.docs.map(doc => {
        const data = doc.data();
        // חייבים להחזיר את כל המבנה כדי שהקליינט יוכל ליצור תיק
        return {
            id: doc.id,
            title: data.title || "ללא כותרת",
            category: data.category || "general",
            shortDescription: data.shortDescription || "",
            requirements: data.requirements || [], // <--- וידוא שלא חוזר undefined
            workflow: data.workflow || [],         // <--- התיקון הקריטי!
            slaHours: data.slaHours || 0,
            lastUpdated: data.lastUpdated || new Date().toISOString()
        } as RequestTemplate;
    });
}