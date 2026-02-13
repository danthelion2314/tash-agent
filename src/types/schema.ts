// ============================================

export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'file';

export interface Requirement {
    id: string;
    title: string;
    description?: string;
    type: FieldType;
    required: boolean;
    validationRule?: string;
    allowMultiple?: boolean;
    // חדש: למי הדרישה מיועדת
    assignedTo?: 'soldier' | 'mashak' | 'commander';
}

export interface ProcessStep {
    order: number;
    title: string;
    description: string;
    isAutomated: boolean;
    // חדש: מי אחראי על הצעד
    responsible?: 'soldier' | 'mashak' | 'commander' | 'system';
}

// ============================================
// הממשק המעודכן - תבנית בקשה
// ============================================
export interface RequestTemplate {
    id: string;
    title: string;
    category: string;
    shortDescription: string;

    // === שדות חדשים לזיהוי AI ===

    // קריטריונים לזכאות - מערך של תנאים
    eligibilityCriteria: string[];

    // מילות מפתח לזיהוי AI
    aiKeywords: string[];

    // גורם מאשר
    approvingAuthority: string;

    // האם דורש ביקור בית
    requiresHomeVisit: boolean;

    // האם דורש הצהרת מהימנות
    requiresDeclaration: boolean;

    // נוהל 30 בימים (אופציונלי)
    procedure30Days?: number;

    // הטבות נלוות
    relatedBenefits?: string[];

    // === שדות קיימים ===

    // אישורים נדרשים מהחייל
    requirements: Requirement[];

    // זרימת העבודה (פעולות מש"ק)
    workflow: ProcessStep[];

    // פעולות נדרשות מהחייל (חדש - מפורט יותר)
    soldierActions?: string[];

    // פעולות נדרשות מהמש"ק (חדש - מפורט יותר)
    mashakActions?: string[];

    slaHours: number;
    lastUpdated: string;
}

export interface ChecklistItem {
    id: string;
    text: string;
    isChecked: boolean;
    type: 'soldier_doc' | 'commander_action' | 'mashak_action';
    // חדש: האם זה דרישה או פעולה
    category?: 'document' | 'action';
}

export interface Soldier {
    id: string;
    personalId: string;
    fullName: string;
    unit?: string;
    phone?: string;
    notes?: string;

    // === שדות חדשים לסיווג ===
    // האם חייל בודד
    isLoneSoldier?: boolean;
    loneSoldierType?: 'muvhak' | 'hame' | 'suid-help';

    // האם תשמ"ש
    isTashmash?: boolean;
    tashmashType?: 'parents' | 'married' | 'pregnancy' | 'married-child';

    // האם אוכלוסיית אור
    isOrPopulation?: boolean;
    orType?: string;

    createdAt: any;
    updatedAt?: any;
}

export interface ConsultationCase {
    id: string;
    userId: string;
    soldierId: string;
    soldierName: string;
    soldierDescription: string;

    templateId: string;
    templateTitle: string;

    soldierChecklist: ChecklistItem[];
    commanderChecklist: ChecklistItem[];

    status: 'active' | 'completed' | 'archived';

    // === שדות חדשים ===
    // צ'קליסט פעולות מש"ק
    mashakChecklist?: ChecklistItem[];

    // המלצות AI
    aiRecommendation?: string;
    matchedKeywords?: string[];

    createdAt: any;
    updatedAt: any;
}

// ============================================
// קטגוריות זמינות
// ============================================
export const REQUEST_CATEGORIES = {
    tashmash: { name: 'תשמ"ש', icon: '💰' },
    lone_soldier: { name: 'חייל בודד', icon: '🧑‍✈️' },
    housing: { name: 'דיור', icon: '🏠' },
    helana: { name: 'הלנות', icon: '🌙' },
    hakash: { name: 'הקלות', icon: '📅' },
    economic: { name: 'כלכלי', icon: '💵' },
    leave: { name: 'חופשות', icon: '🏖️' },
    shortening: { name: 'קיצור שירות', icon: '⏱️' },
    or_population: { name: 'אוכלוסיות אור', icon: '⭐' },
    other: { name: 'אחר', icon: '📋' }
} as const;
