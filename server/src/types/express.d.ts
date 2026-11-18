export {};

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      user?: {
        id: string;
        email: string;
        displayName: string;
      };
      household?: {
        id: string;
        name: string;
        role: "OWNER" | "MEMBER";
        scopes: string[];
      };
    }
  }
}
