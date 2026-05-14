export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
}

export interface ConsultationMessage {
  id?: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface JamuItem {
  id: string;
  name: string;
  benefits: string[];
  ingredients: string[];
  description: string;
  image: string;
  shopeeUrl: string;
  price: number;
  recipe?: string[];
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}
