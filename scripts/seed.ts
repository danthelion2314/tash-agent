import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// --- הגדרת הטיפוסים (כדי שהסקריפט ירוץ עצמאית) ---
export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'file';
export interface Requirement {
    id: string; title: string; description?: string; type: FieldType; required: boolean; validationRule?: string;
    allowMultiple?: boolean;
}
export interface ProcessStep { order: number; title: string; description: string; isAutomated: boolean; }
export interface RequestTemplate { id: string; title: string; category: string; shortDescription: string; requirements: Requirement[]; workflow: ProcessStep[]; slaHours: number; lastUpdated: string; }

// ==========================================
// המאגר המלא - ספר הת"ש וספר התשמ"ש 2025
// ==========================================
const DATA_TO_UPLOAD: RequestTemplate[] = [

    // -----------------------------------------------------------
    // קטגוריה 1: תשמ"ש (תשלומי משפחה)
    // -----------------------------------------------------------
    {
        id: "tashmash-parents",
        title: "תשמ\"ש הורים (סיוע כלכלי)",
        category: "tashmash",
        shortDescription: "סיוע חודשי לחייל שהוריו נמצאים במצוקה כלכלית ואינם מגיעים לסף ההכנסה לנפש.",
        slaHours: 336, // 14 יום
        lastUpdated: new Date().toISOString(),
        requirements: [
            { id: "confidentiality_waiver", title: "ויתור סודיות הורים (חתום)", description: "חתימת שני ההורים על הטופס המאפשר בדיקה מול ביטוח לאומי.", type: "file", required: true },
            { id: "parents_id", title: "צילום ת.ז הורים + ספח", description: "כולל פירוט האחים בספח.", type: "file", required: true, allowMultiple: true },
            { id: "bank_statements", title: "דפי חשבון בנק הורים (3 חודשים)", description: "עובר ושב מלא של 3 חודשים אחרונים עבור כל חשבונות ההורים.", type: "file", required: true, allowMultiple: true },
            { id: "income_docs", title: "הוכחות הכנסה הורים", description: "תלושי שכר (3 אחרונים) / אישורי פנסיה / קצבאות ביטוח לאומי.", type: "file", required: true, allowMultiple: true },
            { id: "vehicle_declaration", title: "הצהרת רכב", description: "האם קיים רכב בבעלות ההורים? (נדרש רישיון רכב אם כן).", type: "boolean", required: true }
        ],
        workflow: [
            { order: 1, title: "בדיקת מסמכים ונתונים", description: "וידוא הכנסות מול תקרות התשמ\"ש", isAutomated: true },
            { order: 2, title: "ביקור בית (אם נדרש)", description: "במקרים חריגים או בקשה ראשונה", isAutomated: false },
            { order: 3, title: "הזנה ב-SAP", description: "הזנת הבקשה למערכת השכר", isAutomated: false }
        ]
    },
    {
        id: "tashmash-married-basic",
        title: "תשמ\"ש נשוי (ללא ילדים)",
        category: "tashmash",
        shortDescription: "סיוע לחייל נשוי המתגורר עם אשתו.",
        slaHours: 336,
        lastUpdated: new Date().toISOString(),
        requirements: [
            { id: "marriage_cert", title: "תעודת נישואין", description: "צילום מקור.", type: "file", required: true },
            { id: "couple_ids", title: "צילום ת.ז בני הזוג + ספח", description: "ספח מעודכן לסטטוס 'נשוי'.", type: "file", required: true, allowMultiple: true },
            { id: "rent_contract", title: "חוזה שכירות", description: "חוזה בתוקף ע\"ש בני הזוג.", type: "file", required: true },
            { id: "wife_income", title: "הכנסות אישה (3 חודשים)", description: "תלושים או אישור מעמד לא עובד.", type: "file", required: true, allowMultiple: true },
            { id: "confidentiality_waiver", title: "ויתור סודיות", description: "חתום ע\"י החייל והאישה.", type: "file", required: true }
        ],
        workflow: [
            { order: 1, title: "בדיקת זכאות", description: "בדיקת הכנסה לנפש", isAutomated: true },
            { order: 2, title: "אישור מפקד", description: "חתימת מפקד היחידה", isAutomated: false }
        ]
    },
    {
        id: "tashmash-pregnancy",
        title: "תשמ\"ש - הריון (שבוע 14)",
        category: "tashmash",
        shortDescription: "הכרה לצורך מענק וציוד לקראת לידה.",
        slaHours: 168,
        lastUpdated: new Date().toISOString(),
        requirements: [
            { id: "medical_pregnancy", title: "אישור רפואי (שבוע הריון)", description: "חובה לציין שבוע 14 ומעלה ותאריך לידה משוער.", type: "file", required: true },
            { id: "confidentiality_waiver", title: "ויתור סודיות", description: "", type: "file", required: true }
        ],
        workflow: [
            { order: 1, title: "בדיקת שבוע הריון", description: "וידוא שבוע 14+", isAutomated: true },
            { order: 2, title: "עדכון צפי ילד", description: "הזנה במערכת לקראת מענק", isAutomated: false }
        ]
    },

    // -----------------------------------------------------------
    // קטגוריה 2: חייל בודד (אוכלוסיות מיוחדות)
    // -----------------------------------------------------------
    {
        id: "lone-soldier-muvhak",
        title: "חייל בודד מובהק (הורים בחו\"ל)",
        category: "lone_soldier",
        shortDescription: "הכרה בחייל שהוריו מתגוררים דרך קבע בחו\"ל.",
        slaHours: 168,
        lastUpdated: new Date().toISOString(),
        requirements: [
            { id: "passport_entries", title: "תמצית רישום כניסות/יציאות", description: "של ההורים ושל החייל (משרד הפנים).", type: "file", required: true, allowMultiple: true },
            { id: "parents_center_life", title: "הוכחת מרכז חיים הורים", description: "אישור עבודה בחו\"ל / חוזה שכירות בחו\"ל / אישור מסים בחו\"ל.", type: "file", required: true, allowMultiple: true },
            { id: "parents_letter", title: "מכתב מההורים", description: "מכתב המסביר מדוע אינם בארץ ומאשרים שהחייל גר לבד.", type: "file", required: true },
            { id: "visit_report", title: "דו\"ח ביקור בית", description: "בדיקת הדירה בה החייל מתגורר.", type: "file", required: false } // לפעמים עושים אחרי
        ],
        workflow: [
            { order: 1, title: "בדיקת כניסות יציאות", description: "וידוא שההורים שוהים בחו\"ל מעל התקופה הנדרשת", isAutomated: true },
            { order: 2, title: "ראיון מש\"קית ת\"ש", description: "מילוי שאלון בודד", isAutomated: false },
            { order: 3, title: "אישור רמ\"ד פרט", description: "אישור סופי להכרה", isAutomated: false }
        ]
    },
    {
        id: "lone-soldier-hame",
        title: "חייל בודד חסר עורף משפחתי (חע\"מ)",
        category: "lone_soldier",
        shortDescription: "הכרה בחייל שיש לו הורים בארץ אך אינו בקשר עמם.",
        slaHours: 500, // תהליך ארוך
        lastUpdated: new Date().toISOString(),
        requirements: [
            { id: "social_worker_report", title: "דו\"ח עו\"ס (רווחה)", description: "דו\"ח סוציאלי מהרשות המקומית המעיד על הנתק/מצב בבית.", type: "file", required: true },
            { id: "affidavits", title: "תצהירים משפטיים (עו\"ד/בימ\"ש)", description: "תצהיר החייל + תצהיר גורם שלישי המכיר את המקרה.", type: "file", required: true, allowMultiple: true },
            { id: "personal_letter", title: "מכתב אישי מהחייל", description: "תיאור השתלשלות האירועים והקשר עם ההורים.", type: "file", required: true },
            { id: "bank_check", title: "בדיקת חשבון בנק", description: "שלילת העברות כספים מההורים.", type: "file", required: true }
        ],
        workflow: [
            { order: 1, title: "ראיון עומק", description: "ראיון עם קצינת ת\"ש", isAutomated: false },
            { order: 2, title: "ביקור בית", description: "חובה לביצוע", isAutomated: false },
            { order: 3, title: "וועדת בודדים", description: "הכרעה בוועדה פיקודית/חילית", isAutomated: false }
        ]
    },

    // -----------------------------------------------------------
    // קטגוריה 3: דיור
    // -----------------------------------------------------------
    {
        id: "rent-participation",
        title: "השתתפות בשכר דירה",
        category: "housing",
        shortDescription: "סיוע במימון שכר דירה לחיילים בודדים או זכאי סיוע.",
        slaHours: 168,
        lastUpdated: new Date().toISOString(),
        requirements: [
            { id: "rent_contract_original", title: "חוזה שכירות מקורי", description: "חתום ע\"י החייל ובעל הדירה. תקף לשנה לפחות.", type: "file", required: true },
            { id: "landlord_id", title: "צילום ת.ז בעל הדירה", description: "", type: "file", required: true },
            { id: "bank_ownership", title: "אישור בעלות חשבון (חייל)", description: "שאליו ייכנס הכסף.", type: "file", required: true },
            { id: "arnona_bill", title: "חשבון ארנונה", description: "על שם בעל הדירה (להוכחת בעלות).", type: "file", required: false }
        ],
        workflow: [
            { order: 1, title: "בדיקת חוזה", description: "וידוא סכום ותאריכים", isAutomated: true },
            { order: 2, title: "הזנה למערכת דיור", description: "", isAutomated: false }
        ]
    },
    {
        id: "beit-hachayal",
        title: "בקשה לבית החייל (לינה)",
        category: "housing",
        shortDescription: "פתרון לינה לחיילים הזקוקים למגורים.",
        slaHours: 48, // מהיר
        lastUpdated: new Date().toISOString(),
        requirements: [
            { id: "commander_approval", title: "המלצת מפקד", description: "אישור שהחייל זקוק לפתרון לינה.", type: "file", required: true },
            { id: "id_photo", title: "תמונת פספורט", description: "להנפקת כרטיס.", type: "file", required: false }
        ],
        workflow: [
            { order: 1, title: "בדיקת מקום פנוי", description: "בדיקה מול בית החייל הרלוונטי", isAutomated: false },
            { order: 2, title: "הפנייה", description: "הנפקת הפנייה ממוחשבת", isAutomated: false }
        ]
    },

    // -----------------------------------------------------------
    // קטגוריה 4: סיוע כלכלי
    // -----------------------------------------------------------
    {
        id: "work-permit",
        title: "אישור עבודה פרטי",
        category: "economic",
        shortDescription: "היתר לעבוד בזמן השירות הצבאי (מחוץ לשעות הפעילות).",
        slaHours: 72,
        lastUpdated: new Date().toISOString(),
        requirements: [
            { id: "bank_minus", title: "צילום עו\"ש (מינוס)", description: "דפי חשבון המראים יתרה שלילית או מצוקה.", type: "file", required: true },
            { id: "commander_rec", title: "המלצת מפקד ישיר", description: "אישור שהעבודה לא תפגע בשירות.", type: "boolean", required: true }
        ],
        workflow: [
            { order: 1, title: "בדיקת נתונים", description: "", isAutomated: true },
            { order: 2, title: "חתימת סא\"ל", description: "אישור מפקד היחידה (בדרגת סא\"ל)", isAutomated: false }
        ]
    },
    {
        id: "bzack-grant",
        title: "מענק בזק (סיוע דחוף)",
        category: "economic",
        shortDescription: "מענק כספי חד-פעמי למצוקה כלכלית חריפה ומיידית.",
        slaHours: 48,
        lastUpdated: new Date().toISOString(),
        requirements: [
            { id: "bank_3_months", title: "דפי בנק 3 חודשים", description: "חובה להראות התנהלות כלכלית וחריגה.", type: "file", required: true },
            { id: "debt_proofs", title: "הוכחות חובות/עיקולים", description: "מכתבי הוצאה לפועל, חובות שכר דירה וכו'.", type: "file", required: true, allowMultiple: true },
            { id: "social_report", title: "דו\"ח סוציאלי (מש\"קית)", description: "תיאור המקרה והצורך הדחוף.", type: "text", required: true }
        ],
        workflow: [
            { order: 1, title: "בדיקת תקציב", description: "בדיקת יתרת תקציב יחידתי", isAutomated: false },
            { order: 2, title: "אישור מפקד יחידה", description: "", isAutomated: false },
            { order: 3, title: "הזנה לתשלום", description: "הכסף נכנס תוך 3 ימים", isAutomated: false }
        ]
    },
    {
        id: "special-economic-leave",
        title: "חופשה מיוחדת כלכלית",
        category: "leave",
        shortDescription: "חופשה של עד 30 יום לצורך עבודה וסיוע למשפחה.",
        slaHours: 168,
        lastUpdated: new Date().toISOString(),
        requirements: [
            { id: "work_permit_valid", title: "אישור עבודה בתוקף", description: "תנאי סף לבקשה.", type: "boolean", required: true },
            { id: "debts_docs", title: "מסמכי חובות", description: "הוכחה שיש צורך קריטי לעבוד ימים מלאים.", type: "file", required: true, allowMultiple: true },
            { id: "commander_approval_days", title: "אישור מפקד לימי החופשה", description: "", type: "boolean", required: true }
        ],
        workflow: [
            { order: 1, title: "ראיון מש\"קית", description: "הבנת הצורך בחופשה מלאה", isAutomated: false },
            { order: 2, title: "אישור אל\"מ", description: "מיוחדת מעל מס' ימים דורשת אישור בכיר", isAutomated: false }
        ]
    }
];

// -----------------------------------------------------------
// לוגיקת ההעלאה
// -----------------------------------------------------------
dotenv.config({ path: '.env.local' });

// שימוש ב-readFileSync כמו שביקשת כדי למנוע בעיות Import
const serviceAccount = JSON.parse(readFileSync('./service-account-key.json', 'utf8'));

if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function uploadTemplates() {
    console.log(`🚀 מתחיל בטעינת ${DATA_TO_UPLOAD.length} סוגי בקשות...`);
    try {
        const batch = db.batch();
        DATA_TO_UPLOAD.forEach((template) => {
            const ref = db.collection('requestTemplates').doc(template.id);
            batch.set(ref, template);
        });
        await batch.commit();
        console.log('✅ הנתונים נטענו בהצלחה!');
    } catch (error) {
        console.error('❌ שגיאה:', error);
    }
}

uploadTemplates();