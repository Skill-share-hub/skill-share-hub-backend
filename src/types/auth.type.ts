export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: "student" | "tutor" | "premiumTutor" | "admin";
  verificationStatus: "pending" | "verified" | "rejected";
}