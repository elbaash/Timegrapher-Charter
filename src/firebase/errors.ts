export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

// A custom error class to provide more context about
// which security rule failed.
export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
${JSON.stringify({
  context: {
    path: context.path,
    operation: context.operation,
    requestResourceData: context.requestResourceData || 'No data provided',
  },
}, null, 2)}`;

    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is to make the error visible in the Next.js overlay
    if (typeof (this as any).stack === 'undefined') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
