import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiCheckSquare,
  FiClipboard,
  FiDollarSign,
  FiFileText,
  FiFlag,
  FiGrid,
  FiHome,
  FiMessageSquare,
  FiSettings,
  FiCoffee,
  FiShield,
  FiSearch,
  FiTrendingUp,
  FiUser,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import type { DashboardNavSection } from "./Layout/DashboardSidebar";
export const DASHBOARD_ROLES = [
  "SUPER_ADMIN",
  "MANAGER",
  "GUIDE",
  "TEACHER",
  "STAFF",
  "STUDENT",
] as const;
export type DashboardRole = (typeof DASHBOARD_ROLES)[number];
export function isDashboardRole(value: unknown): value is DashboardRole {
  return (
    typeof value === "string" &&
    (DASHBOARD_ROLES as readonly string[]).includes(value)
  );
}
export const SUPER_ADMIN_NAVIGATION: DashboardNavSection[] = [
  {
    id: "overview",
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard Overview", icon: FiHome }],
  },
  {
    id: "people",
    title: "People",
    items: [
      { href: "/admin/students", label: "Students", icon: FiUsers },
      { href: "/admin/users", label: "Staff & Users", icon: FiShield },
    ],
  },
  {
    id: "learning",
    title: "Learning",
    items: [
      { href: "/admin/courses", label: "Courses", icon: FiBookOpen },
      {
        href: "/admin/classes",
        label: "Batches & Schedules",
        icon: FiCalendar,
      },
      { href: "/admin/skill-center", label: "Skill Center", icon: FiGrid },
      {
        href: "/admin/guide-performance",
        label: "Guide Performance",
        icon: FiActivity,
      },
      {
        href: "/admin/academic-performance",
        label: "Student Performance & KPI",
        icon: FiBarChart2,
      },
      {
        href: "/admin/leaderboard",
        label: "Leaderboard & Talent",
        icon: FiAward,
      },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    items: [
      { href: "/admin/attendance", label: "Attendance", icon: FiCheckSquare },
    ],
  },
  {
    id: "finance",
    title: "Finance",
    items: [
      {
        href: "/admin/finance",
        label: "Finance & Payments",
        icon: FiDollarSign,
      },
      {
        href: "/admin/finance/expenses",
        label: "Expenses",
        icon: FiDollarSign,
      },
      {
        href: "/admin/staff-adjustments",
        label: "Staff Fines & Gifts",
        icon: FiDollarSign,
      },
      {
        href: "/admin/staff-performance",
        label: "Staff KPI & Performance",
        icon: FiActivity,
      },
      {
        href: "/admin/announcements",
        label: "Announcements",
        icon: FiMessageSquare,
      },
      {
        href: "/admin/notifications",
        label: "Notifications",
        icon: FiMessageSquare,
      },
      {
        href: "/admin/finance/expense-policies",
        label: "Expense Policies",
        icon: FiSettings,
      },
    ],
  },
  {
    id: "system",
    title: "System",
    items: [
      { href: "/admin/reports", label: "Reports", icon: FiTrendingUp },
      { href: "/admin/website", label: "Website & Content", icon: FiFileText },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: FiFlag },
      { href: "/admin/settings", label: "Settings", icon: FiSettings },
    ],
  },
];
export const MANAGER_NAVIGATION: DashboardNavSection[] = [
  {
    id: "overview",
    title: "Overview",
    items: [{ href: "/manager", label: "Dashboard Overview", icon: FiHome }],
  },
  {
    id: "people",
    title: "People",
    items: [
      { href: "/manager/students", label: "Students", icon: FiUsers },
      {
        href: "/manager/students/register",
        label: "Register Student",
        icon: FiUserCheck,
      },
      {
        href: "/manager/students/enroll",
        label: "Enroll Existing Student",
        icon: FiUserCheck,
      },
      {
        href: "/manager/student-history",
        label: "Student History",
        icon: FiSearch,
      },
      {
        href: "/manager/guides",
        label: "Staff & Guide Management",
        icon: FiShield,
      },
    ],
  },

  {
    id: "learning",
    title: "Learning",
    items: [
      { href: "/manager/courses", label: "Courses", icon: FiBookOpen },
      {
        href: "/manager/classes",
        label: "Batches & Schedules",
        icon: FiCalendar,
      },
      {
        href: "/manager/attendance",
        label: "Student Attendance",
        icon: FiCheckSquare,
      },
      {
        href: "/manager/staff-attendance",
        label: "Staff Attendance",
        icon: FiCheckSquare,
      },
      { href: "/manager/skill-center", label: "Skill Center", icon: FiGrid },
      {
        href: "/manager/monthly-tests",
        label: "Monthly Class Tests",
        icon: FiClipboard,
      },
    ],
  },

  {
    id: "operations",
    title: "Operations",
    items: [
      { href: "/manager/finance", label: "Finance", icon: FiDollarSign },
      { href: "/manager/expenses", label: "Daily Expenses", icon: FiCoffee },
      { href: "/manager/reports", label: "Reports", icon: FiTrendingUp },
      {
        href: "/manager/announcements",
        label: "Announcements",
        icon: FiMessageSquare,
      },
      {
        href: "/manager/notifications",
        label: "Notifications",
        icon: FiMessageSquare,
      },
      {
        href: "/manager/website",
        label: "Website & Content",
        icon: FiFileText,
      },
      {
        href: "/manager/staff-adjustments",
        label: "Staff Fines & Gifts",
        icon: FiDollarSign,
      },
      {
        href: "/manager/staff-performance",
        label: "Staff KPI & Performance",
        icon: FiActivity,
      },
    ],
  },
];
export const GUIDE_NAVIGATION: DashboardNavSection[] = [
  {
    id: "overview",
    title: "Overview",
    items: [{ href: "/guide", label: "Dashboard Overview", icon: FiHome }],
  },
  {
    id: "teaching",
    title: "Teaching",
    items: [
      { href: "/guide/students", label: "My Students", icon: FiUsers },
      {
        href: "/guide/sessions",
        label: "Skill Center Sessions",
        icon: FiCalendar,
      },
      { href: "/guide/assignments", label: "Assignments", icon: FiClipboard },
      {
        href: "/guide/attendance",
        label: "Skill Center Attendance",
        icon: FiCheckSquare,
      },
      { href: "/guide/kpa", label: "KPI Evaluations", icon: FiBarChart2 },
      {
        href: "/guide/monthly-tests",
        label: "Monthly Class Tests",
        icon: FiClipboard,
      },
      {
        href: "/guide/progress",
        label: "Student Progress",
        icon: FiTrendingUp,
      },
      { href: "/guide/performance", label: "My Performance", icon: FiAward },
      {
        href: "/guide/notifications",
        label: "Notifications",
        icon: FiMessageSquare,
      },
    ],
  },
];
export const STUDENT_NAVIGATION: DashboardNavSection[] = [
  {
    id: "overview",
    title: "Overview",
    items: [
      { href: "/student", label: "Dashboard Overview", icon: FiHome },
      { href: "/student/leaderboard", label: "Leaderboard", icon: FiAward },
      {
        href: "/student/notifications",
        label: "Notifications",
        icon: FiMessageSquare,
      },
    ],
  },
  {
    id: "learning",
    title: "Learning",
    items: [
      {
        href: "/student/courses",
        label: "My Courses & Classes",
        icon: FiBookOpen,
      },
      { href: "/student/schedule", label: "My Schedule", icon: FiCalendar },
      {
        href: "/student/attendance",
        label: "My Attendance",
        icon: FiCheckSquare,
      },
      {
        href: "/student/monthly-tests",
        label: "Monthly Test",
        icon: FiClipboard,
      },
      {
        href: "/student/marks",
        label: "My Results & Feedback",
        icon: FiTrendingUp,
      },
      {
        href: "/student/progress",
        label: "My Performance & KPI",
        icon: FiTrendingUp,
      },
    ],
  },
  {
    id: "account",
    title: "Account",
    items: [
      { href: "/student/payments", label: "My Payments", icon: FiDollarSign },
      { href: "/student/profile", label: "My Profile", icon: FiUser },
    ],
  },
];
export const TEACHER_NAVIGATION: DashboardNavSection[] = [
  {
    id: "overview",
    title: "Overview",
    items: [{ href: "/teacher", label: "Dashboard Overview", icon: FiHome }],
  },
  {
    id: "teaching",
    title: "Teaching",
    items: [
      {
        href: "/teacher/classes",
        label: "My Classes & Students",
        icon: FiUsers,
      },
      {
        href: "/teacher/attendance",
        label: "My Attendance",
        icon: FiCheckSquare,
      },
      {
        href: "/teacher/student-attendance",
        label: "Student Attendance History",
        icon: FiCheckSquare,
      },
      {
        href: "/teacher/performance",
        label: "My Performance & Salary",
        icon: FiDollarSign,
      },
      { href: "/teacher/profile", label: "My Profile", icon: FiUser },
      {
        href: "/teacher/progress",
        label: "Student Progress & KPI",
        icon: FiTrendingUp,
      },
      {
        href: "/teacher/leaderboard",
        label: "Student Leaderboard",
        icon: FiAward,
      },
      {
        href: "/teacher/notifications",
        label: "Notifications",
        icon: FiMessageSquare,
      },
    ],
  },
];
export const STAFF_NAVIGATION: DashboardNavSection[] = [
  {
    id: "overview",
    title: "Overview",
    items: [
      { href: "/staff", label: "Dashboard Overview", icon: FiHome },
      {
        href: "/staff/notifications",
        label: "Notifications",
        icon: FiMessageSquare,
      },
      {
        href: "/staff/account",
        label: "My Account & Adjustments",
        icon: FiDollarSign,
      },
      {
        href: "/staff/performance",
        label: "My KPI & Performance",
        icon: FiActivity,
      },
    ],
  },
];
export interface DashboardRoleConfig {
  homeHref: string;
  profileHref?: string;
  brandSubtitle: string;
  defaultRoleLabel: string;
  sections: DashboardNavSection[];
}
export const DASHBOARD_ROLE_CONFIG: Record<DashboardRole, DashboardRoleConfig> =
  {
    SUPER_ADMIN: {
      homeHref: "/admin",
      brandSubtitle: "Administration",
      defaultRoleLabel: "Super Admin",
      sections: SUPER_ADMIN_NAVIGATION,
    },
    MANAGER: {
      homeHref: "/manager",
      brandSubtitle: "Management",
      defaultRoleLabel: "Manager",
      sections: MANAGER_NAVIGATION,
    },
    GUIDE: {
      homeHref: "/guide",
      brandSubtitle: "Guide workspace",
      defaultRoleLabel: "Guide",
      sections: GUIDE_NAVIGATION,
    },
    TEACHER: {
      homeHref: "/teacher",
      brandSubtitle: "Teacher workspace",
      defaultRoleLabel: "Teacher",
      sections: TEACHER_NAVIGATION,
    },
    STAFF: {
      homeHref: "/staff",
      brandSubtitle: "Staff workspace",
      defaultRoleLabel: "Staff",
      sections: STAFF_NAVIGATION,
    },
    STUDENT: {
      homeHref: "/student",
      profileHref: "/student/profile",
      brandSubtitle: "Student portal",
      defaultRoleLabel: "Student",
      sections: STUDENT_NAVIGATION,
    },
  };
