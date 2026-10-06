export type LoyaltyLevel = "gold" | "silver" | "bronze";

export interface User {
  birthday?: string;
  gender?: "" | "male" | "female" | "other";
  readOnlyFields?: ("name" | "phone" | "avatar")[];
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email?: string;
  zaloId?: string;
  loyaltyLevel?: LoyaltyLevel;
  points?: number;
}
