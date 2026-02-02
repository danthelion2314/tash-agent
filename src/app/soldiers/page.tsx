"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Soldier } from "@/types/schema";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Users, Plus, Search, User, ChevronLeft, Loader2 } from "lucide-react";

export default function SoldiersListPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [soldiers, setSoldiers] = useState<Soldier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // טופס חייל חדש
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newSoldierName, setNewSoldierName] = useState("");
    const [newSoldierId, setNewSoldierId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // טעינת חיילים
    useEffect(() => {
        async function fetchSoldiers() {
            if (!user) return;
            try {
                const q = query(collection(db, "soldiers"), orderBy("createdAt", "desc"));
                const snapshot = await getDocs(q);
                setSoldiers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Soldier)));
            } catch (error) {
                console.error("Error fetching soldiers:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSoldiers();
    }, [user]);

    // הוספת חייל חדש
    const handleAddSoldier = async () => {
        if (!newSoldierName || !newSoldierId) return;
        setIsSubmitting(true);

        try {
            const docRef = await addDoc(collection(db, "soldiers"), {
                fullName: newSoldierName,
                personalId: newSoldierId,
                userId: user?.uid,
                createdAt: serverTimestamp()
            });

            const newSoldier: Soldier = {
                id: docRef.id,
                fullName: newSoldierName,
                personalId: newSoldierId,
                createdAt: new Date()
            };
            setSoldiers([newSoldier, ...soldiers]);
            setIsDialogOpen(false);
            setNewSoldierName("");
            setNewSoldierId("");

            router.push(`/soldiers/${docRef.id}`);
        } catch (e) {
            console.error("Error adding soldier:", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredSoldiers = soldiers.filter(s =>
        s.fullName.includes(searchTerm) || s.personalId.includes(searchTerm)
    );

    return (
        <AppShell>
            <div className="max-w-6xl mx-auto space-y-6 pb-20 px-2 md:px-0">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
                            <Users className="w-8 h-8 text-blue-600" />
                            החיילים שלי
                        </h1>
                        <p className="text-slate-500 text-sm md:text-base">ניהול תיקים אישיים ומעקב טיפול</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 gap-2 w-full md:w-auto shadow-lg shadow-blue-900/20">
                                <Plus className="w-4 h-4" /> הוסף חייל חדש
                            </Button>
                        </DialogTrigger>

                        {/* התיקון כאן: bg-white ו-z-index גבוה */}
                        <DialogContent className="bg-white sm:max-w-[425px] z-[9999]">
                            <DialogHeader>
                                <DialogTitle>פתיחת תיק חייל חדש</DialogTitle>
                                <DialogDescription>
                                    הזן את פרטי החייל כדי להתחיל בתהליך הטיפול.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">שם מלא</label>
                                    <Input
                                        value={newSoldierName}
                                        onChange={e => setNewSoldierName(e.target.value)}
                                        placeholder="לדוגמה: ישראל ישראלי"
                                        className="bg-slate-50 border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">מספר אישי / ת.ז</label>
                                    <Input
                                        value={newSoldierId}
                                        onChange={e => setNewSoldierId(e.target.value)}
                                        placeholder="1234567"
                                        className="bg-slate-50 border-slate-200"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddSoldier} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700">
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : "צור תיק ופתח"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        className="pr-10 h-12 text-base bg-white border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500/20"
                        placeholder="חיפוש לפי שם או מספר אישי..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Soldiers Grid */}
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>
                ) : filteredSoldiers.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="font-medium text-slate-600">אין תוצאות</p>
                        <p className="text-sm">לא נמצאו חיילים ברשימה.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSoldiers.map((soldier) => (
                            <Card
                                key={soldier.id}
                                className="hover:shadow-lg transition-all cursor-pointer border-slate-200 hover:border-blue-300 group bg-white"
                                onClick={() => router.push(`/soldiers/${soldier.id}`)}
                            >
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors border border-slate-100">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h3 className="font-bold text-lg text-slate-900 truncate">{soldier.fullName}</h3>
                                        <p className="text-slate-500 text-sm font-mono">{soldier.personalId}</p>
                                    </div>
                                    <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-transform group-hover:-translate-x-1" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}