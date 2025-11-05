'use client';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, Query, DocumentData, CollectionReference } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Memoize the query to prevent re-renders
export const useMemoFirebase = <T>(factory: () => T, deps: any[]): T => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
};

export const useCollection = <T extends DocumentData>(
  collectionRef: CollectionReference | Query | null,
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!collectionRef) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(collectionRef, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        setData(docs);
        setLoading(false);
      },
      (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionRef]);

  return { data, loading, error };
};
