import { EventEmitter } from 'events';

// This is a simple event emitter that will be used to globally
// handle Firestore permission errors.
// It allows deep components to signal an error has occurred
// without needing to propagate it up the component tree.
export const errorEmitter = new EventEmitter();
