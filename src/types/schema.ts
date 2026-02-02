export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'file';

export interface Requirement {
    id: string;
    title: string;
    description?: string;
    type: FieldType;
    required: boolean;
    validationRule?: string;
    allowMultiple?: boolean;
}

export interface ProcessStep {
    order: number;
    title: string;
    description: string;
    isAutomated: boolean;
}

export interface RequestTemplate {
    id: string;
    title: string;
    category: string;
    shortDescription: string;
    requirements: Requirement[];
    workflow: ProcessStep[];
    slaHours: number;
    lastUpdated: string;
}

export interface ChecklistItem {
    id: string;
    text: string;
    isChecked: boolean;
    type: 'soldier_doc' | 'commander_action';
}

// --- הוספנו את זה ---
export interface Soldier {
    id: string;
    personalId: string;
    fullName: string;
    unit?: string;
    phone?: string;
    notes?: string;
    createdAt: any;
}

export interface ConsultationCase {
    id: string;
    userId: string;
    soldierId: string; // חובה
    soldierName: string; // חובה
    soldierDescription: string;

    templateId: string;
    templateTitle: string;

    soldierChecklist: ChecklistItem[];
    commanderChecklist: ChecklistItem[];

    status: 'active' | 'completed' | 'archived';
    createdAt: any;
    updatedAt: any;
}