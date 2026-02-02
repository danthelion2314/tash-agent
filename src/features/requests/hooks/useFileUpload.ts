import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase"; // וודא שזה מיוצא נכון (הסבר למטה)
import { v4 as uuidv4 } from "uuid"; // נצטרך להתקין את זה

export function useFileUpload() {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = async (file: File, path: string): Promise<string> => {
        setUploading(true);
        setProgress(0);
        setError(null);

        return new Promise((resolve, reject) => {
            // יצירת שם ייחודי לקובץ כדי למנוע דריסות
            const uniqueName = `${uuidv4()}_${file.name}`;
            const storageRef = ref(storage, `${path}/${uniqueName}`);

            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(p);
                },
                (err) => {
                    console.error("Upload failed:", err);
                    setError("העלאת הקובץ נכשלה");
                    setUploading(false);
                    reject(err);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setUploading(false);
                    resolve(downloadURL);
                }
            );
        });
    };

    return { uploadFile, uploading, progress, error };
}