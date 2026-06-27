declare module "lucide-react" {
  import type { ComponentType, SVGProps } from "react";

  export type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

  export const ArrowLeft: LucideIcon;
  export const Calendar: LucideIcon;
  export const CalendarDays: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const LogOut: LucideIcon;
  export const Mail: LucideIcon;
  export const MapPin: LucideIcon;
  export const Pencil: LucideIcon;
  export const Plus: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Trash2: LucideIcon;
  export const User: LucideIcon;
  export const UserCheck: LucideIcon;
  export const Users: LucideIcon;
  export const X: LucideIcon;
}
