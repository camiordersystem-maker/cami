import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "admin" | "member";
      reviewExpiresAt?: string;
      managedAuth?: boolean;
      profileIncomplete?: boolean;
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
    managedAuthUserId?: string;
    profileIncomplete?: boolean;
  }
}
