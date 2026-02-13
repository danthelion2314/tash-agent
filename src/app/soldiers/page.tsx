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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-up">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center border border-blue-200/30">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            החיילים שלי
                        </h1>
                        <p className="text-slate-500 text-sm md:text-base mt-1 mr-[52px]">ניהול תיקים אישיים ומעקב טיפול</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2 w-full md:w-auto shadow-lg shadow-blue-600/20 h-11 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] border-0">
                                <Plus className="w-4 h-4" /> הוסף חייל חדש
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="bg-white sm:max-w-[425px] z-[9999] rounded-2xl border-slate-200 shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl">פתיחת תיק חייל חדש</DialogTitle>
                                <DialogDescription>
                                    הזן את פרטי החייל כדי להתחיל בתהליך הטיפול.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">שם מלא</label>
                                    <Input
                                        value={newSoldierName}
                                        onChange={e => setNewSoldierName(e.target.value)}
                                        placeholder="לדוגמה: ישראל ישראלי"
                                        className="bg-slate-50/80 border-slate-200 h-11 rounded-xl focus:bg-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">מספר אישי / ת.ז</label>
                                    <Input
                                        value={newSoldierId}
                                        onChange={e => setNewSoldierId(e.target.value)}
                                        placeholder="1234567"
                                        className="bg-slate-50/80 border-slate-200 h-11 rounded-xl focus:bg-white transition-colors"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddSoldier} disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-11 rounded-xl border-0">
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : "צור תיק ופתח"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search Bar */}
                <div className="relative group animate-fade-up" style={{ animationDelay: '0.1s' }}>
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        className="pr-12 h-12 text-base bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm rounded-xl input-glow transition-all"
                        placeholder="חיפוש לפי שם או מספר אישי..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Soldiers Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
                        <p className="text-sm text-slate-400">טוען רשימה...</p>
                    </div>
                ) : filteredSoldiers.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Users className="w-7 h-7 text-slate-300" />
                        </div>
                        <p className="font-semibold text-slate-600 text-lg">אין תוצאות</p>
                        <p className="text-sm mt-1">לא נמצאו חיילים ברשימה.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                        {filteredSoldiers.map((soldier) => (
                            <Card
                                key={soldier.id}
                                className="card-interactive border-slate-200/60 bg-white/80 backdrop-blur-sm group rounded-xl"
                                onClick={() => router.push(`/soldiers/${soldier.id}`)}
                            >
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:from-blue-50 group-hover:to-indigo-50 group-hover:text-blue-600 transition-all border border-slate-200/60 group-hover:border-blue-200/60">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h3 className="font-bold text-[17px] text-slate-900 truncate group-hover:text-blue-700 transition-colors">{soldier.fullName}</h3>
                                        <p className="text-slate-400 text-sm font-mono mt-0.5">{soldier.personalId}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-all">
                                        <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-all group-hover:-translate-x-0.5" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}