import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { RequestTemplate } from '@/types/schema';

function getAdminDb() {
    // אם האפליקציה כבר אותחלה, נחזיר את ה-DB הקיים
    if (admin.apps.length > 0) {
        return getFirestore();
    }

    // 1. נסיון לטעון ממשתני סביבה (עבור Vercel/Production)
    // ב-Vercel מגדירים את המשתנים: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
    if (process.env.FIREBASE_PRIVATE_KEY) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    // תיקון קריטי: Vercel הופך ירידות שורה ל-\n, צריך להחזיר אותן
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

    // אם הכל נכשל, נחזיר מופע ריק או נזרוק שגיאה
    // (זה ימנע קריסה ב-Build, אבל ה-API לא יעבוד בלי המשתנים)
    if (admin.apps.length === 0) {
        admin.initializeApp(); // אתחול דיפולטיבי (לא יעבוד בלי קרדנשיאלס אמיתיים)
    }

    return getFirestore();
}

const adminDb = getAdminDb();

export async function getAllTemplatesForAI(): Promise<RequestTemplate[]> {
    // בדיקה שיש לנו חיבור
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
                requirements: data.requirements || [],
                workflow: data.workflow || [],
                slaHours: data.slaHours || 0,
                lastUpdated: data.lastUpdated || new Date().toISOString()
            } as RequestTemplate;
        });
    } catch (e) {
        console.error("Error fetching templates via Admin SDK:", e);
        return [];
    }
}