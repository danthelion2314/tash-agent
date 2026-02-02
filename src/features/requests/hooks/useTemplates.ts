import { useState, useEffect } from 'react';
import { TashService } from '@/lib/tash-service';
import { RequestTemplate } from '@/types/schema';

export function useTemplates() {
    const [templates, setTemplates] = useState<RequestTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetch() {
            try {
                const data = await TashService.getAllTemplates();
                setTemplates(data);
            } catch (err) {
                setError('נכשל בטעינת הנתונים');
            } finally {
                setLoading(false);
            }
        }

        fetch();
    }, []);

    return { templates, loading, error };
}