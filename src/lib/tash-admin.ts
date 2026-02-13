// ============================================
// קובץ: src/lib/tash-admin.ts
// החלף את הקובץ הקיים בזה
// מעודכן להחזיר את כל השדות החדשים
// ============================================

import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { RequestTemplate } from '@/types/schema';

function getAdminDb() {
    // אם האפליקציה כבר אותחלה, נחזיר את ה-DB הקיים
    if (admin.apps.length > 0) {
        return getFirestore();
    }

    // 1. נסיון לטעון ממשתני סביבה (עבור Vercel/Production)
    if (process.env.FIREBASE_PRIVATE_KEY) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });
            return getFirestore();
        } catch (error) {
            console.error('Firebase Admin Init Error (Env Vars):', error);
        }
    }

    // 2. נסיון לטעון מקובץ לוקאלי (עבור המחשב שלך)
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const serviceAccount = require('../../service-account-key.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        return getFirestore();
    } catch (error) {
        console.warn('Firebase Admin: Service account file not found. Skipping admin init.');
    }

    if (admin.apps.length === 0) {
        admin.initializeApp();
    }

    return getFirestore();
}

const adminDb = getAdminDb();

export async function getAllTemplatesForAI(): Promise<RequestTemplate[]> {
    if (!adminDb) return [];

    try {
        const snapshot = await adminDb.collection('requestTemplates').get();

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title || "ללא כותרת",
                category: data.category || "general",
                shortDescription: data.shortDescription || "",

                // שדות חדשים ל-AI
                eligibilityCriteria: data.eligibilityCriteria || [],
                aiKeywords: data.aiKeywords || [],
                approvingAuthority: data.approvingAuthority || '',
                requiresHomeVisit: data.requiresHomeVisit || false,
                requiresDeclaration: data.requiresDeclaration || false,
                procedure30Days: data.procedure30Days,
                relatedBenefits: data.relatedBenefits || [],

                // שדות קיימים
                requirements: data.requirements || [],
                workflow: data.workflow || [],

                // פעולות מפורטות
                soldierActions: data.soldierActions || [],
                mashakActions: data.mashakActions || [],

                slaHours: data.slaHours || 0,
                lastUpdated: data.lastUpdated || new Date().toISOString()
            } as RequestTemplate;
        });
    } catch (e) {
        console.error("Error fetching templates via Admin SDK:", e);
        return [];
    }
}

// פונקציה לקבלת תבנית בודדת
export async function getTemplateById(id: string): Promise<RequestTemplate | null> {
    if (!adminDb) return null;

    try {
        const doc = await adminDb.collection('requestTemplates').doc(id).get();
        if (!doc.exists) return null;

        const data = doc.data();
        return {
            id: doc.id,
            title: data?.title || "ללא כותרת",
            category: data?.category || "general",
            shortDescription: data?.shortDescription || "",
            eligibilityCriteria: data?.eligibilityCriteria || [],
            aiKeywords: data?.aiKeywords || [],
            approvingAuthority: data?.approvingAuthority || '',
            requiresHomeVisit: data?.requiresHomeVisit || false,
            requiresDeclaration: data?.requiresDeclaration || false,
            procedure30Days: data?.procedure30Days,
            relatedBenefits: data?.relatedBenefits || [],
            requirements: data?.requirements || [],
            workflow: data?.workflow || [],
            soldierActions: data?.soldierActions || [],
            mashakActions: data?.mashakActions || [],
            slaHours: data?.slaHours || 0,
            lastUpdated: data?.lastUpdated || new Date().toISOString()
        } as RequestTemplate;
    } catch (e) {
        console.error("Error fetching template:", e);
        return null;
    }
}

// פונקציה לחיפוש תבניות לפי מילות מפתח
export async function searchTemplates(query: string): Promise<RequestTemplate[]> {
    const allTemplates = await getAllTemplatesForAI();
    const queryLower = query.toLowerCase();

    return allTemplates.filter(template => {
        // חיפוש בכותרת
        if (template.title.toLowerCase().includes(queryLower)) return true;

        // חיפוש בתיאור
        if (template.shortDescription.toLowerCase().includes(queryLower)) return true;

        // חיפוש במילות מפתח
        if (template.aiKeywords?.some(k => k.toLowerCase().includes(queryLower))) return true;

        // חיפוש בקריטריונים
        if (template.eligibilityCriteria?.some(c => c.toLowerCase().includes(queryLower))) return true;

        return false;
    });
}