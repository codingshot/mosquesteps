import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Bell, BellOff, Check, CheckCheck, Trash2, Filter,
  SortAsc, SortDesc, Settings2, Clock,
  Footprints, Star, Trophy, BarChart3, MapPin, Heart, Zap, Info,
  X, MailOpen, Mail, ExternalLink, AlertCircle, RefreshCw,
  ChevronRight, Sparkles, Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SEOHead from "@/components/SEOHead";
import { getSettings } from "@/lib/walking-history";
import {
  AppNotification, NotificationType, NotificationSettings,
  getNotifications, markAsRead, markAsUnread, markAllAsRead, markTypeAsRead,
  deleteNotification, clearAllNotifications,
  getNotificationSettings, saveNotificationSettings, seedDemoNotifications, getUnreadCount,
} from "@/lib/notification-store";
import {
  isNotificationSupported, getNotificationPermission, requestNotificationPermission,
} from "@/lib/notifications";

// ---- Icon map for each notification type ----
const typeConfig: Record<NotificationType, { icon: typeof Bell; label: string; colorClass: string; bgClass: string }> = {
  prayer_reminder: { icon: Clock,       label: "Prayer",    colorClass: "text-primary",           bgClass: "bg-primary/10" },
  walk_complete:   { icon: Footprints,  label: "Walk",      colorClass: "text-primary",           bgClass: "bg-primary/10" },
  streak:          { icon: Zap,         label: "Streak",    colorClass: "text-destructive",       bgClass: "bg-destructive/10" },
  badge:           { icon: Trophy,      label: "Badge",     colorClass: "text-amber-500",         bgClass: "bg-amber-500/10" },
  weekly_summary:  { icon: BarChart3,   label: "Summary",   colorClass: "text-primary",           bgClass: "bg-primary/10" },
  checkin:         { icon: MapPin,      label: "Check-in",  colorClass: "text-primary",           bgClass: "bg-primary/10" },
  goal:            { icon: Star,        label: "Goal",      colorClass: "text-amber-500",         bgClass: "bg-amber-500/10" },
  health_tip:      { icon: Heart,       label: "Health",    colorClass: "text-destructive",       bgClass: "bg-destructive/10" },
  system:          { icon: Info,        label: "System",    colorClass: "text-muted-foreground",  bgClass: "bg-muted" },
};

type SortOrder = "newest" | "oldest";
type FilterType = "all" | NotificationType;
type ReadFilter = "all" | "unread" | "read";

// ---- Group notifications by date ----
function groupByDate(list: AppNotification[], userTz?: string) {
  const groups: { label: string; items: AppNotification[] }[] = [];
  const seen = new Map<string, number>();

  const dayLabel = (ts: number) => {
    const opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric", ...(userTz ? { timeZone: userTz } : {}) };
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const isToday = d.toDateString() === today.toDateString();
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return d.toLocaleDateString(undefined, opts);
  };

  list.forEach((n) => {
    const label = dayLabel(n.timestamp);
    if (!seen.has(label)) {
      seen.set(label, groups.length);
      groups.push({ label, items: [] });
    }
    groups[seen.get(label)!].items.push(n);
  });

  return groups;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [permStatus, setPermStatus] = useState(getNotificationPermission());
  const [requestingPerm, setRequestingPerm] = useState(false);
  const [snoozeActive, setSnoozeActive] = useState(false);
  const userSettings = getSettings();

  const reload = useCallback(() => setNotifications(getNotifications()), []);

  useEffect(() => {
    seedDemoNotifications();
    reload();
  }, [reload]);

  // Tap-to-read when item enters view
  const handleTapRead = useCallback((id: string, read: boolean) => {
    if (!read) { markAsRead(id); reload(); }
  }, [reload]);

  // ---- Derived data ----
  const filtered = useMemo(() => {
    let list = [...notifications];
    if (filterType !== "all") list = list.filter((n) => n.type === filterType);
    if (readFilter === "unread") list = list.filter((n) => !n.read);
    if (readFilter === "read") list = list.filter((n) => n.read);
    list.sort((a, b) => sortOrder === "newest" ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
    return list;
  }, [notifications, filterType, readFilter, sortOrder]);

  const grouped = useMemo(() => groupByDate(filtered, userSettings.cityTimezone), [filtered, userSettings.cityTimezone]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<NotificationType, number>> = {};
    notifications.forEach((n) => { counts[n.type] = (counts[n.type] || 0) + 1; });
    return counts;
  }, [notifications]);

  const unreadByType = useMemo(() => {
    const counts: Partial<Record<NotificationType, number>> = {};
    notifications.filter(n => !n.read).forEach((n) => { counts[n.type] = (counts[n.type] || 0) + 1; });
    return counts;
  }, [notifications]);

  // ---- Actions ----
  const handleMarkAllRead = () => { markAllAsRead(); reload(); };
  const handleMarkTypeRead = (type: NotificationType) => { markTypeAsRead(type); reload(); };
  const handleDelete = (id: string) => { deleteNotification(id); reload(); };
  const handleClearAll = () => { clearAllNotifications(); reload(); };
  const handleSettingToggle = (key: keyof NotificationSettings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    saveNotificationSettings(next);
  };

  const handleRequestPerm = async () => {
    setRequestingPerm(true);
    const granted = await requestNotificationPermission();
    setPermStatus(granted ? "granted" : "denied");
    setRequestingPerm(false);
  };

  const handleSnooze = () => {
    setSnoozeActive(true);
    setTimeout(() => setSnoozeActive(false), 60 * 60 * 1000); // 1 hr
  };

  // ---- Time formatting ----
  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  const exactDateTime = (ts: number) => {
    const opts: Intl.DateTimeFormatOptions = {
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
      ...(userSettings.cityTimezone ? { timeZone: userSettings.cityTimezone } : {}),
    };
    return new Date(ts).toLocaleString(undefined, opts);
  };

  const notifSupported = isNotificationSupported();

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEOHead
        title="Notifications"
        description="Prayer reminders, walk summaries, and streak notifications. MosqueSteps."
        path="/notifications"
        noindex
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" aria-label="Back to dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 min-w-[18px] h-[18px]">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setShowFilters(!showFilters); setShowSettings(false); }}>
              <Filter className={`w-4 h-4 ${showFilters ? "text-primary" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setShowSettings(!showSettings); setShowFilters(false); }}>
              <Settings2 className={`w-4 h-4 ${showSettings ? "text-primary" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 mt-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleMarkAllRead}>
              <CheckCheck className="w-3 h-3 mr-1" /> Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" className="text-xs h-7 text-destructive hover:text-destructive" onClick={handleClearAll}>
              <Trash2 className="w-3 h-3 mr-1" /> Clear all
            </Button>
          )}
          <Button
            variant="ghost" size="sm" className="text-xs h-7 ml-auto"
            onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
          >
            {sortOrder === "newest" ? <SortDesc className="w-3 h-3 mr-1" /> : <SortAsc className="w-3 h-3 mr-1" />}
            {sortOrder === "newest" ? "Newest" : "Oldest"}
          </Button>
        </div>
      </header>

      {/* ── Permission banner ── */}
      <AnimatePresence>
        {notifSupported && permStatus !== "granted" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {permStatus === "denied" ? (
              <div className="mx-4 mt-3 bg-destructive/10 border border-destructive/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                  <p className="text-sm font-semibold text-destructive">Notifications blocked by browser</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {/iPhone|iPad|iPod/.test(navigator.userAgent)
                    ? "Go to Settings app → Apps → Safari → Notifications → Allow, then return here."
                    : /Android/.test(navigator.userAgent)
                    ? 'Tap the 🔒 lock in the address bar → Permissions → Notifications → Allow, then refresh.'
                    : 'Click the 🔒 lock icon in the address bar → Notifications → Allow, then refresh.'}
                </p>
                <Button size="sm" variant="outline" className="w-full border-destructive/30 text-destructive hover:text-destructive" onClick={() => window.location.reload()}>
                  <RefreshCw className="w-3 h-3 mr-1.5" /> I've unblocked — Refresh
                </Button>
              </div>
            ) : (
              <div className="mx-4 mt-3 bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Enable push notifications</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Get reminded before each prayer so you never miss Jama'ah.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {["🕌 Prayer departure reminders","🔥 Streak & badge alerts","📊 Weekly walk summary","💡 Health tips"].map(t => (
                    <span key={t} className="flex items-center gap-1"><Check className="w-3 h-3 text-primary shrink-0" />{t.slice(2)}</span>
                  ))}
                </div>
                <Button className="w-full" size="sm" onClick={handleRequestPerm} disabled={requestingPerm}>
                  <Bell className="w-4 h-4 mr-2" />
                  {requestingPerm ? "Requesting…" : "Enable Notifications"}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Snooze bar ── */}
      {permStatus === "granted" && (
        <div className="mx-4 mt-3 flex items-center justify-between bg-muted/40 border border-border rounded-xl px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Volume2 className="w-3.5 h-3.5" />
            <span>{snoozeActive ? "Reminders snoozed for 1 hour" : "Reminders active"}</span>
          </div>
          <Button
            variant={snoozeActive ? "outline" : "ghost"}
            size="sm"
            className="text-xs h-7"
            onClick={snoozeActive ? () => setSnoozeActive(false) : handleSnooze}
          >
            {snoozeActive ? "Resume" : "Snooze 1h"}
          </Button>
        </div>
      )}

      {/* ── Filters panel ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-card/50"
          >
            <div className="px-4 py-3 space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">By type</p>
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip data-testid="filter-type-all" active={filterType === "all"} onClick={() => setFilterType("all")} count={notifications.length}>All</FilterChip>
                  {(Object.keys(typeConfig) as NotificationType[]).map((t) => {
                    const count = typeCounts[t] || 0;
                    if (count === 0) return null;
                    return (
                      <FilterChip key={t} data-testid={`filter-type-${t}`} active={filterType === t} onClick={() => setFilterType(t)} count={count} unread={unreadByType[t] || 0}>
                        {typeConfig[t].label}
                      </FilterChip>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">By status</p>
                <div className="flex gap-1.5">
                  <FilterChip data-testid="filter-status-all" active={readFilter === "all"} onClick={() => setReadFilter("all")}>All</FilterChip>
                  <FilterChip data-testid="filter-status-unread" active={readFilter === "unread"} onClick={() => setReadFilter("unread")} count={unreadCount}>Unread</FilterChip>
                  <FilterChip data-testid="filter-status-read" active={readFilter === "read"} onClick={() => setReadFilter("read")}>Read</FilterChip>
                </div>
              </div>
              {filterType !== "all" && (unreadByType[filterType as NotificationType] || 0) > 0 && (
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleMarkTypeRead(filterType as NotificationType)}>
                  <CheckCheck className="w-3 h-3 mr-1" /> Mark {typeConfig[filterType as NotificationType]?.label} as read
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Preferences panel ── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-card/50"
          >
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notification Preferences</p>
                <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => navigate("/settings")}>
                  Full settings <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
              </div>
              <SettingRow label="Prayer reminders"  icon={Clock}     description="Departure reminders before each prayer"     checked={settings.prayerReminders} onChange={() => handleSettingToggle("prayerReminders")} />
              <SettingRow label="Walk updates"       icon={Footprints} description="When you complete a mosque walk"          checked={settings.walkUpdates}     onChange={() => handleSettingToggle("walkUpdates")} />
              <SettingRow label="Streak alerts"      icon={Zap}       description="Streak milestones and at-risk warnings"    checked={settings.streakAlerts}    onChange={() => handleSettingToggle("streakAlerts")} />
              <SettingRow label="Badge alerts"       icon={Trophy}    description="New badges and achievements"               checked={settings.badgeAlerts}     onChange={() => handleSettingToggle("badgeAlerts")} />
              <SettingRow label="Weekly summary"     icon={BarChart3} description="Your walking stats every Sunday"           checked={settings.weeklySummary}   onChange={() => handleSettingToggle("weeklySummary")} />
              <SettingRow label="Health tips"        icon={Heart}     description="Walking & wellness tips"                   checked={settings.healthTips}      onChange={() => handleSettingToggle("healthTips")} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notification list ── */}
      <div className="px-4 py-3 space-y-4">
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              {permStatus !== "granted"
                ? <BellOff className="w-8 h-8 text-muted-foreground/40" />
                : <Sparkles className="w-8 h-8 text-muted-foreground/40" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {filterType !== "all" || readFilter !== "all" ? "No matching notifications" : "You're all caught up!"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                {filterType !== "all" || readFilter !== "all"
                  ? "Try adjusting your filters."
                  : permStatus !== "granted"
                  ? "Enable notifications above to get prayer reminders and walk updates."
                  : "Notifications will appear here after your first walk or prayer reminder."}
              </p>
            </div>
            {permStatus !== "granted" && notifSupported && (
              <Button size="sm" onClick={handleRequestPerm} disabled={requestingPerm}>
                <Bell className="w-4 h-4 mr-2" /> Enable Notifications
              </Button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {grouped.map(({ label, items }) => (
              <motion.div key={label} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Date group header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                  <div className="flex-1 h-px bg-border" />
                  {items.some(n => !n.read) && (
                    <span className="text-[10px] text-primary font-medium">{items.filter(n => !n.read).length} unread</span>
                  )}
                </div>

                <div className="space-y-2">
                  {items.map((n) => {
                    const config = typeConfig[n.type];
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.18 }}
                        className={`relative rounded-xl border overflow-hidden transition-colors cursor-pointer ${
                          n.read ? "bg-card/50 border-border" : "bg-primary/5 border-primary/20"
                        }`}
                        onClick={() => handleTapRead(n.id, n.read)}
                      >
                        {/* Unread indicator strip */}
                        {!n.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-l-xl" />
                        )}

                        <div className="p-3 flex gap-3">
                          {/* Icon */}
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${n.read ? "bg-muted" : config.bgClass}`}>
                            <Icon className={`w-4 h-4 ${config.colorClass}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm leading-tight ${n.read ? "font-medium text-foreground/80" : "font-bold text-foreground"}`}>
                                {n.title}
                              </p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-[10px] text-muted-foreground/60 cursor-help">{timeAgo(n.timestamp)}</span>
                                </TooltipTrigger>
                                <TooltipContent className="p-2" side="bottom">
                                  <p className="text-xs">{exactDateTime(n.timestamp)}</p>
                                </TooltipContent>
                              </Tooltip>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-[14px] border-border/50">
                                {config.label}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Action row */}
                        <div className="flex items-center gap-1 px-3 pb-2 justify-end flex-wrap border-t border-border/30 pt-1.5">
                          {/* Contextual actions */}
                          {n.type === "prayer_reminder" && (
                            <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 text-primary hover:text-primary" asChild>
                              <Link to="/walk"><Footprints className="w-3 h-3 mr-0.5" /> Start Walk</Link>
                            </Button>
                          )}
                          {n.type === "walk_complete" && (
                            <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" asChild>
                              <Link to="/history"><BarChart3 className="w-3 h-3 mr-0.5" /> History</Link>
                            </Button>
                          )}
                          {n.type === "streak" && (
                            <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" asChild>
                              <Link to="/rewards"><Trophy className="w-3 h-3 mr-0.5" /> Rewards</Link>
                            </Button>
                          )}
                          {n.type === "badge" && (
                            <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" asChild>
                              <Link to="/rewards"><Star className="w-3 h-3 mr-0.5" /> Badges</Link>
                            </Button>
                          )}
                          {n.type === "weekly_summary" && (
                            <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" asChild>
                              <Link to="/stats"><BarChart3 className="w-3 h-3 mr-0.5" /> Stats</Link>
                            </Button>
                          )}
                          {n.issueUrl && (
                            <a href={n.issueUrl} target="_blank" rel="noopener noreferrer"
                               className="inline-flex items-center gap-0.5 text-[10px] h-6 px-2 font-medium text-primary hover:underline">
                              <ExternalLink className="w-3 h-3 mr-0.5" /> Report
                            </a>
                          )}
                          {/* Read / unread toggle */}
                          {n.read ? (
                            <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2"
                              onClick={(e) => { e.stopPropagation(); markAsUnread(n.id); reload(); }}>
                              <Mail className="w-3 h-3 mr-0.5" /> Unread
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2"
                              onClick={(e) => { e.stopPropagation(); markAsRead(n.id); reload(); }}>
                              <MailOpen className="w-3 h-3 mr-0.5" /> Read
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 text-destructive hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}>
                            <X className="w-3 h-3 mr-0.5" /> Remove
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ---- Sub-components ----

function FilterChip({ active, onClick, children, count, unread, "data-testid": testId }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
  count?: number; unread?: number; "data-testid"?: string;
}) {
  return (
    <button
      type="button" onClick={onClick} data-testid={testId}
      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors font-medium flex items-center gap-1 ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className={`text-[9px] ${active ? "text-primary-foreground/70" : "text-muted-foreground/50"}`}>{count}</span>
      )}
      {unread !== undefined && unread > 0 && !active && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
      )}
    </button>
  );
}

function SettingRow({ label, icon: Icon, description, checked, onChange }: {
  label: string; icon: typeof Bell; description: string; checked: boolean; onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-foreground font-medium">{label}</p>
          <p className="text-[11px] text-muted-foreground truncate">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
