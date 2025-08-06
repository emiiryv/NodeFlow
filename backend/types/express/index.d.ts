import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: number;
      tenantId: number;
      role: string;
    };
  }
}