import { useEffect, useRef, useState } from 'react';
import { apiGet } from '../lib/apiClient';

export function useMedicineSearch(query, limit = 20) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    const trimmed = (query || '').trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await apiGet(`/api/medicines/search?query=${encodeURIComponent(trimmed)}&limit=${limit}`);
        setResults(data?.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, limit]);

  return { results, loading };
}
