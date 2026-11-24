import { LayoutDashboard, Link2, MailWarning, Bot, Radar, Lock, GraduationCap, History, FileText, Settings, type LucideIcon } from "lucide-react";

export type NavItem = { label: string; icon: LucideIcon; to?: "/dashboard" | "/settings" | "/url-scanner" | "/phishing" | "/history" | "/assistant" | "/threats" | "/privacy" | "/academy" | "/reports" };

// Items without `to` are modules scheduled for upcoming phases; they render disabled.
export const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "URL Scanner", icon: Link2, to: "/url-scanner" },
  { label: "Phishing Detector", icon: MailWarning, to: "/phishing" },
  { label: "AI Security Assistant", icon: Bot, to: "/assistant" },
  { label: "Threat Intelligence", icon: Radar, to: "/threats" },
  { label: "Digital Privacy", icon: Lock, to: "/privacy" },
  { label: "Security Academy", icon: GraduationCap, to: "/academy" },
  { label: "Scan History", icon: History, to: "/history" },
  { label: "Security Reports", icon: FileText, to: "/reports" },
  { label: "Settings", icon: Settings, to: "/settings" },
];
