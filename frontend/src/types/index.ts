export type Role = "admin" | "user" | "system_user";
export type LocationType =
  "province" | "district" | "sector" | "cell" | "village";

export const LOCATION_TYPES: LocationType[] = [
  "province",
  "district",
  "sector",
  "cell",
  "village",
];

export const PARENT_TYPE: Record<LocationType, LocationType | null> = {
  province: null,
  district: "province",
  sector: "district",
  cell: "sector",
  village: "cell",
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  locationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  parentId: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type IssueType = "bad_citizen" | "umuganda_absence" | "other";
export type IssueStatus =
  "pending" | "reviewed" | "reported_to_police" | "closed";

export interface IssueReply {
  id: string;
  issueId: string;
  userId: string;
  message: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  reportedBy: string;
  locationId: string | null;
  createdAt: string;
  updatedAt: string;
  replies?: IssueReply[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  locationId: string | null;
  createdAt: string;
  updatedAt: string;
  isRead?: boolean;
}
