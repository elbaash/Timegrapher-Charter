'use client';
import { ReactNode, useEffect, useState } from 'react';
import { initializeFirebase } from './config';
import { FirebaseProvider } from './provider';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

type FirebaseInstances = {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
};

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [firebase, setFirebase] = useState<FirebaseInstances | null>(null);

  useEffect(() => {
    // Initialize Firebase on the client
    const instances = initializeFirebase();
    setFirebase(instances);
  }, []);

  if (!firebase) {
    // You can return a loader here if you'd like
    return null; 
  }

  return (
    <FirebaseProvider app={firebase.app} firestore={firebase.firestore} auth={firebase.auth}>
      {children}
    </FirebaseProvider>
  );
}
