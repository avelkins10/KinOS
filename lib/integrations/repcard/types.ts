/**
 * RepCard API type definitions.
 * Matches response shapes from RepCard API (https://app.repcard.com/api).
 */

export interface RepCardUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  address: string;
  office: string;
  team: string;
  jobTitle: string;
  phoneNumber: string;
  image: string;
  rating: string;
  bio: string;
  companyName: string;
  badgeId: string;
  qrCode: string;
  dob?: string | null;
}

export interface RepCardUserMinimal {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username?: string;
  jobTitle?: string;
  phoneNumber?: string;
  image?: string;
}

export interface RepCardCustomer {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  companyName: string;
  statusId: number;
  address: string | null;
  address2: string | null;
  state: string | null;
  city: string | null;
  zip: string | null;
  latitude: string | null;
  longitude: string | null;
  externalId: string | null;
  type: number;
  userId: number;
  ownerId: number;
  contactSource: string;
  fullPhoneNumber?: string;
}

export interface RepCardCustomerAttachment {
  id: number;
  customerId: number;
  url?: string;
  name?: string;
  [key: string]: unknown;
}

export interface RepCardWebhookCustomer {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  countryCode?: string;
  phoneNumber?: string;
  fullPhoneNumber?: string;
  companyName?: string;
  statusId?: number;
  address?: string | null;
  address2?: string | null;
  state?: string | null;
  city?: string | null;
  zip?: string | null;
  type?: number;
  userId?: number;
  ownerId?: number;
  contactSource?: string;
}

export interface RepCardWebhookUser {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  jobTitle?: string;
}

export interface RepCardWebhookPayload {
  customers: RepCardWebhookCustomer;
  user: RepCardWebhookUser;
}

export interface RepCardApiResponse<T> {
  data?: T;
  meta?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
  };
}

export interface RepCardApiError {
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
}
