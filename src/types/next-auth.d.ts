import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "admin" | "member";
      reviewExpiresAt?: string;
    };
  }
  interface User {
    id: string;
    role: "admin" | "member";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "member";
    reviewAuthUserId?: string;
    reviewExpiresAt?: string;
  }
}
