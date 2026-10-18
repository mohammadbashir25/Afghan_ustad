"use client";

/**
 * DashboardHeader
 *
 * Responsibilities:
 *  - Mobile menu button (hidden on lg+, where the sidebar is persistent).
 *  - Breadcrumbs + page title.
 *  - Role-scoped notification bell with unread count and read actions.
 *  - User avatar/initials, name, role and a profile dropdown.
 *
 * Not responsible for: authentication. Logout is a callback supplied by the
 * parent, so wire it to Auth.js's signOut later.
 *
 * Both dropdowns are plain disclosure popovers (button + aria-expanded), not
 * ARIA menus, so no arrow-key handling is required. They close on outside
 * click and Esc, and Esc returns focus to the trigger.
 *
 * Layout notes:
 *  - Logical properties (start/end, ms/me) keep it RTL-friendly.
 *  - On small screens the user's name/role are hidden and the title truncates.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FiBell,
  FiChevronDown,
  FiChevronRight,
  FiLoader,
  FiLogOut,
  FiMenu,
  FiUser,
} from "react-icons/fi";

/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

export interface DashboardBreadcrumb {
  label: string;
  /** Omit on the last (current) crumb. */
  href?: string;
}

export interface DashboardHeaderUser {
  name: string;
  /** Already-translated role label, e.g. "Manager". */
  roleLabel: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface DashboardHeaderLabels {
  openMenu: string;
  breadcrumb: string;
  notifications: string;
  notificationsEmptyTitle: string;
  notificationsEmptyBody: string;
  profileMenu: string;
  profile: string;
  logout: string;
  loggingOut: string;
}

export interface DashboardHeaderProps {
  /** Page title shown in the header (rendered as the page's <h1>). */
  title: string;
  breadcrumbs?: DashboardBreadcrumb[];
  user: DashboardHeaderUser;
  /** Opens the sidebar drawer on mobile. */
  onOpenMobileMenu: () => void;
  /** Supplied by the parent; may be async. No auth logic lives here. */
  onLogout: () => void | Promise<void>;
  /** Unprefixed route for the profile page. The item is hidden if omitted. */
  profileHref?: string;
  labels?: Partial<DashboardHeaderLabels>;
  notificationsHref?: string;
}

const DEFAULT_LABELS: DashboardHeaderLabels = {
  openMenu: "Open navigation menu",
  breadcrumb: "Breadcrumb",
  notifications: "Notifications",
  notificationsEmptyTitle: "You're all caught up",
  notificationsEmptyBody:
    "Course, enrollment, finance, and academic updates will appear here.",
  profileMenu: "Account menu",
  profile: "Profile",
  logout: "Log out",
  loggingOut: "Logging out…",
};

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0].charAt(0);
  const second = parts.length > 1 ? parts[1].charAt(0) : "";
  return (first + second).toUpperCase();
}

/** Closes a popover on outside pointer-down or Esc (Esc also restores focus). */
function useDismiss(
  open: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const container = containerRef.current;
      if (container && !container.contains(event.target as Node)) onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, containerRef, triggerRef]);
}

function Avatar({ user }: { user: DashboardHeaderUser }) {
  if (user.avatarUrl) {
    return (
      // Plain <img>: avatar hosts are unknown, so we avoid next/image config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt=""
        className="size-9 shrink-0 rounded-full border border-[#DCE7E2] object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E6F4EE] text-sm font-semibold text-[#053B2E]"
    >
      {getInitials(user.name)}
    </span>
  );
}

/* ----------------------------------------------------------------------------
 * Header
 * ------------------------------------------------------------------------- */

export default function DashboardHeader({
  title,
  breadcrumbs,
  user,
  onOpenMobileMenu,
  onLogout,
  profileHref,
  labels,
  notificationsHref = "/notifications",
}: DashboardHeaderProps) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const reduceMotion = useReducedMotion();

  // Only one popover is open at a time.
  const [openPanel, setOpenPanel] = useState<
    "notifications" | "profile" | null
  >(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      title: string;
      message: string;
      kind: string;
      read: boolean;
      createdAt: string | null;
    }>
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");

  const notificationsRef = useRef<HTMLDivElement>(null);
  const notificationsTriggerRef = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);

  const closePanel = useCallback(() => setOpenPanel(null), []);

  useDismiss(
    openPanel === "notifications",
    closePanel,
    notificationsRef,
    notificationsTriggerRef,
  );
  useDismiss(
    openPanel === "profile",
    closePanel,
    profileRef,
    profileTriggerRef,
  );

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load notifications.");
      const data = (await response.json()) as {
        unreadCount?: number;
        notifications?: Array<{
          id: string;
          title: string;
          message: string;
          kind: string;
          read: boolean;
          createdAt: string | null;
        }>;
      };
      setNotificationsError("");
      setNotifications(
        Array.isArray(data.notifications) ? data.notifications : [],
      );
      setUnreadCount(Number(data.unreadCount || 0));
    } catch {
      setNotificationsError(
        "Notifications could not be loaded. Please try again.",
      );
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/notifications", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load notifications.");
        }

        const data = (await response.json()) as {
          unreadCount?: number;
          notifications?: Array<{
            id: string;
            title: string;
            message: string;
            kind: string;
            read: boolean;
            createdAt: string | null;
          }>;
        };

        if (cancelled) return;

        setNotificationsError("");
        setNotifications(
          Array.isArray(data.notifications) ? data.notifications : [],
        );
        setUnreadCount(Number(data.unreadCount || 0));
      } catch {
        if (!cancelled) {
          setNotificationsError(
            "Notifications could not be loaded. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setNotificationsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function markNotificationRead(id: string) {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Unable to update notification.");
      setNotifications((items) =>
        items.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
      const data = (await response.json()) as { unreadCount?: number };
      setUnreadCount(Number(data.unreadCount || 0));
    } catch {
      setNotificationsError("Could not mark this notification as read.");
    }
  }

  async function markAllRead() {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!response.ok) throw new Error("Unable to update notifications.");
      setNotifications((items) =>
        items.map((item) => ({ ...item, read: true })),
      );
      setUnreadCount(0);
    } catch {
      setNotificationsError("Could not mark notifications as read.");
    }
  }

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      // If logout redirects, this is a harmless no-op; if it fails, re-enable.
      setIsLoggingOut(false);
    }
  }

  const popoverMotion = reduceMotion
    ? {
        initial: false as const,
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: -4 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
        transition: { duration: 0.15, ease: "easeOut" as const },
      };

  const hasBreadcrumbs = breadcrumbs && breadcrumbs.length > 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-[#DCE7E2] bg-white px-4 sm:px-6">
      {/* Mobile menu trigger */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        aria-label={t.openMenu}
        className={`-ms-1 flex size-10 shrink-0 items-center justify-center rounded-lg text-[#12372E] transition-colors hover:bg-[#F1F5F3] lg:hidden ${FOCUS_RING}`}
      >
        <FiMenu aria-hidden className="size-5" />
      </button>

      {/* Breadcrumbs + title. min-w-0 lets the title truncate instead of overflowing. */}
      <div className="min-w-0 flex-1">
        {hasBreadcrumbs && (
          <nav aria-label={t.breadcrumb} className="hidden sm:block">
            <ol className="flex items-center gap-1 text-xs text-[#64748B]">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <li
                    key={`${crumb.label}-${index}`}
                    className="flex min-w-0 items-center gap-1"
                  >
                    {index > 0 && (
                      <FiChevronRight
                        aria-hidden
                        className="size-3 shrink-0 rtl:rotate-180"
                      />
                    )}
                    {crumb.href && !isLast ? (
                      <Link
                        href={crumb.href}
                        className={`truncate rounded transition-colors hover:text-[#12372E] ${FOCUS_RING}`}
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        aria-current={isLast ? "page" : undefined}
                        className="truncate"
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
        <h1 className="truncate text-base font-semibold leading-tight text-[#12372E] sm:text-lg">
          {title}
        </h1>
      </div>

      {/* Right cluster */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Notifications are scoped to the signed-in user by the API. */}
        <div ref={notificationsRef} className="relative">
          <button
            ref={notificationsTriggerRef}
            type="button"
            onClick={() => {
              const opening = openPanel !== "notifications";
              setOpenPanel(opening ? "notifications" : null);
              if (opening) void loadNotifications();
            }}
            aria-label={
              unreadCount
                ? `${t.notifications}, ${unreadCount} unread`
                : t.notifications
            }
            aria-haspopup="dialog"
            aria-expanded={openPanel === "notifications"}
            className={`relative flex size-10 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#F1F5F3] hover:text-[#12372E] ${FOCUS_RING}`}
          >
            <FiBell aria-hidden className="size-5" />
            {unreadCount > 0 && (
              <span
                className="absolute -end-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-4 text-white"
                aria-hidden="true"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {openPanel === "notifications" && (
              <motion.div
                {...popoverMotion}
                role="dialog"
                aria-label={t.notifications}
                className="absolute end-0 top-full z-40 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[#DCE7E2] bg-white shadow-xl"
              >
                <div className="flex items-center justify-between gap-3 border-b border-[#DCE7E2] px-4 py-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[#12372E]">
                      {t.notifications}
                    </h2>
                    <p className="mt-0.5 text-xs text-[#64748B]">
                      {unreadCount} unread
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void markAllRead()}
                      className={`text-xs font-semibold text-[#0B6B4F] hover:underline ${FOCUS_RING}`}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {notificationsLoading ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    Loading notifications…
                  </div>
                ) : notificationsError ? (
                  <div role="alert" className="px-4 py-5 text-sm text-rose-700">
                    {notificationsError}
                    <button
                      type="button"
                      onClick={() => void loadNotifications()}
                      className="ms-2 font-semibold underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : notifications.length ? (
                  <ul className="max-h-[min(60vh,28rem)] overflow-y-auto divide-y divide-[#EDF2EF]">
                    {notifications.map((item) => (
                      <li
                        key={item.id}
                        className={`px-4 py-3 ${item.read ? "bg-white" : "bg-[#F1F8F4]"}`}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-1.5 size-2 shrink-0 rounded-full ${item.read ? "bg-slate-300" : "bg-[#0B6B4F]"}`}
                            aria-hidden="true"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#12372E]">
                              {item.title}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-600">
                              {item.message}
                            </p>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="text-[11px] text-slate-400">
                                {item.createdAt
                                  ? new Date(item.createdAt).toLocaleString()
                                  : ""}
                              </span>
                              {!item.read && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void markNotificationRead(item.id)
                                  }
                                  className={`text-xs font-semibold text-[#0B6B4F] hover:underline ${FOCUS_RING}`}
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center px-6 py-8 text-center">
                    <span
                      aria-hidden
                      className="flex size-10 items-center justify-center rounded-full bg-[#F1F5F3] text-[#64748B]"
                    >
                      <FiBell className="size-5" />
                    </span>
                    <p className="mt-3 text-sm font-medium text-[#12372E]">
                      {t.notificationsEmptyTitle}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#64748B]">
                      {t.notificationsEmptyBody}
                    </p>
                  </div>
                )}
                <div className="border-t border-[#DCE7E2] px-4 py-3">
                  <Link
                    href={notificationsHref}
                    onClick={closePanel}
                    className={`block text-center text-sm font-semibold text-[#0B6B4F] hover:underline ${FOCUS_RING}`}
                  >
                    View all notifications
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            ref={profileTriggerRef}
            type="button"
            onClick={() =>
              setOpenPanel((p) => (p === "profile" ? null : "profile"))
            }
            aria-label={`${t.profileMenu}: ${user.name}`}
            aria-haspopup="true"
            aria-expanded={openPanel === "profile"}
            className={`flex h-11 items-center gap-2.5 rounded-lg ps-1 pe-1 transition-colors hover:bg-[#F1F5F3] sm:pe-2 ${FOCUS_RING}`}
          >
            <Avatar user={user} />
            <span className="hidden min-w-0 max-w-40 text-start md:block">
              <span className="block truncate text-sm font-medium leading-tight text-[#12372E]">
                {user.name}
              </span>
              <span className="block truncate text-xs leading-tight text-[#64748B]">
                {user.roleLabel}
              </span>
            </span>
            <FiChevronDown
              aria-hidden
              className="hidden size-4 shrink-0 text-[#64748B] sm:block"
            />
          </button>

          <AnimatePresence>
            {openPanel === "profile" && (
              <motion.div
                {...popoverMotion}
                className="absolute end-0 top-full z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[#DCE7E2] bg-white shadow-lg"
              >
                {/* Identity block (also the only place name/role show on phones). */}
                <div className="flex items-center gap-3 border-b border-[#DCE7E2] px-4 py-3">
                  <Avatar user={user} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#12372E]">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-[#64748B]">
                      {user.email ?? user.roleLabel}
                    </p>
                  </div>
                </div>

                <div className="p-1.5">
                  {profileHref && (
                    <Link
                      href={profileHref}
                      onClick={closePanel}
                      className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-[#12372E] transition-colors hover:bg-[#F1F5F3] ${FOCUS_RING}`}
                    >
                      <FiUser
                        aria-hidden
                        className="size-4 shrink-0 text-[#64748B]"
                      />
                      <span className="truncate">{t.profile}</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-start text-sm text-[#12372E] transition-colors hover:bg-[#F1F5F3] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
                  >
                    {isLoggingOut ? (
                      <FiLoader
                        aria-hidden
                        className="size-4 shrink-0 animate-spin text-[#64748B]"
                      />
                    ) : (
                      <FiLogOut
                        aria-hidden
                        className="size-4 shrink-0 text-[#64748B]"
                      />
                    )}
                    <span className="truncate">
                      {isLoggingOut ? t.loggingOut : t.logout}
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
