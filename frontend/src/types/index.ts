export type Role = "admin" | "user" | "system_user";
export type LocationType =
  | "province"
  | "district"
  | "sector"
  | "cell"
  | "village";

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
