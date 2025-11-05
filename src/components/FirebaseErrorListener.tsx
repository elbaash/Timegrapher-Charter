'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

// This is a client component that will listen for 'permission-error' events
// and throw them to be caught by the Next.js error overlay.
// This is only for use in development.
export function FirebaseErrorListener() {
  useEffect(() => {
    const handler = (error: Error) => {
      // In development, we want to see the rich error overlay.
      // In production, you might want to log this to a service.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      } else {
        console.error(error);
      }
    };

    errorEmitter.on('permission-error', handler);

    return () => {
      errorEmitter.off('permission-error', handler);
    };
  }, []);

  return null; // This component does not render anything.
}
