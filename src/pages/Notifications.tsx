import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Bell, BellOff, Check, CheckCheck, Trash2, Filter,
  SortAsc, SortDesc, Settings2, ChevronDown, Clock,
  Footprints, Star, Trophy, BarChart3, MapPin, Heart, Zap, Info,
  X, MailOpen, Mail, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getSettings } from "@/lib/walking-history";
import {
  AppNotification, NotificationType, NotificationSettings,
  getNotifications, markAsRead, markAsUnread, markAllAsRead, markTypeAsRead,
  deleteNotification, clearAllNotifications,
  getNotificationSettings, saveNotificationSettings, seedDemoNotifications, getUnreadCount,
} from "@/lib/notification-store";

// ---- Icon map for each notification type ----
const typeConfig: Record<NotificationType, { icon: typeof Bell; label: string; color: string }> = {
  prayer_reminder: { icon: Clock, label: "Prayer", color: "text-primary" },
  walk_complete:   { icon: Footprints, label: "Walk", color: "text-primary" },
  streak:          { icon: Zap, label: "Streak", color: "text-destructive" },
  badge:           { icon: Trophy, label: "Badge", color: "text-gold" },
  weekly_summary:  { icon: BarChart3, label: "Summary", color: "text-primary" },
  checkin:         { icon: MapPin, label: "Check-in", color: "text-primary" },
  goal:            { icon: Star, label: "Goal", color: "text-gold" },
  health_tip:      { icon: Heart, label: "Health", color: "text-destructive" },
  system:          { icon: Info, label: "System", color: "text-muted-foreground" },
};

type SortOrder = "newest" | "oldest";
type FilterType = "all" | NotificationType;
type ReadFilter = "all" | "unread" | "read";

export default function Notifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const userSettings = getSettings();

  const reload = () => setNotifications(getNotifications());

  useEffect(() => {
    seedDemoNotifications();
    reload();
  }, []);

  // ---- Derived data ----
  const filtered = useMemo(() => {
    let list = [...notifications];
    if (filterType !== "all") list = list.filter((n) => n.type === filterType);
    if (readFilter === "unread") list = list.filter((n) => !n.read);
    if (readFilter === "read") list = list.filter((n) => n.read);
    list.sort((a, b) => sortOrder === "newest" ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
    return list;
  }, [notifications, filterType, readFilter, sortOrder]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  // Count by type
  const typeCounts = useMemo(() => {
    const counts: Partial<Record<NotificationType, number>> = {};
    notifications.forEach((n) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  const unreadByType = useMemo(() => {
    const counts: Partial<Record<NotificationType, number>> = {};
    notifications.filter(n => !n.read).forEach((n) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  // ---- Actions ----
  const handleMarkRead = (id: string) => { markAsRead(id); reload(); };
  const handleMarkUnread = (id: string) => { markAsUnread(id); reload(); };
  const handleMarkAllRead = () => { markAllAsRead(); reload(); };
  const handleMarkTypeRead = (type: NotificationType) => { markTypeAsRead(type); reload(); };
  const handleDelete = (id: string) => { deleteNotification(id); reload(); };
  const handleClearAll = () => { clearAllNotifications(); reload(); };
  const handleSettingToggle = (key: keyof NotificationSettings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    saveNotificationSettings(next);
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
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...(userSettings.cityTimezone ? { timeZone: userSettings.cityTimezone } : {}),
    };
    return new Date(ts).toLocaleString(undefined, opts);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
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

        {/* Quick actions bar */}
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

      {/* Filters panel */}
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
                  <FilterChip active={filterType === "all"} onClick={() => setFilterType("all")} count={notifications.length}>All</FilterChip>
                  {(Object.keys(typeConfig) as NotificationType[]).map((t) => {
                    const count = typeCounts[t] || 0;
                    if (count === 0) return null;
                    const unread = unreadByType[t] || 0;
                    return (
                      <FilterChip key={t} active={filterType === t} onClick={() => setFilterType(t)} count={count} unread={unread}>
                        {typeConfig[t].label}
                      </FilterChip>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">By status</p>
                <div className="flex gap-1.5">
                  <FilterChip active={readFilter === "all"} onClick={() => setReadFilter("all")}>All</FilterChip>
                  <FilterChip active={readFilter === "unread"} onClick={() => setReadFilter("unread")} count={unreadCount}>Unread</FilterChip>
                  <FilterChip active={readFilter === "read"} onClick={() => setReadFilter("read")}>Read</FilterChip>
                </div>
              </div>
              {/* Mark type as read */}
              {filterType !== "all" && (unreadByType[filterType as NotificationType] || 0) > 0 && (
                <Button
                  variant="outline" size="sm" className="text-xs h-7"
                  onClick={() => handleMarkTypeRead(filterType as NotificationType)}
                >
                  <CheckCheck className="w-3 h-3 mr-1" /> Mark all {typeConfig[filterType as NotificationType]?.label} as read
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-card/50"
          >
            <div className="px-4 py-3 space-y-2.5">
              <p className="text-xs font-semibold text-muted-foreground">Notification Preferences</p>
              <SettingRow label="Prayer reminders" icon={Clock} checked={settings.prayerReminders} onChange={() => handleSettingToggle("prayerReminders")} />
              <SettingRow label="Walk updates" icon={Footprints} checked={settings.walkUpdates} onChange={() => handleSettingToggle("walkUpdates")} />
              <SettingRow label="Streak alerts" icon={Zap} checked={settings.streakAlerts} onChange={() => handleSettingToggle("streakAlerts")} />
              <SettingRow label="Badge alerts" icon={Trophy} checked={settings.badgeAlerts} onChange={() => handleSettingToggle("badgeAlerts")} />
              <SettingRow label="Weekly summary" icon={BarChart3} checked={settings.weeklySummary} onChange={() => handleSettingToggle("weeklySummary")} />
              <SettingRow label="Health tips" icon={Heart} checked={settings.healthTips} onChange={() => handleSettingToggle("healthTips")} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification list */}
      <div className="px-4 py-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <BellOff className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">No notifications</p>
            <p className="text-xs text-muted-foreground/60">
              {filterType !== "all" || readFilter !== "all"
                ? "Try adjusting your filters."
                : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((n) => {
                const config = typeConfig[n.type];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`relative rounded-xl border p-3 transition-colors ${
                      n.read
                        ? "bg-card/50 border-border"
                        : "bg-primary/5 border-primary/20"
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Type icon */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        n.read ? "bg-muted" : "bg-primary/10"
                      }`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-tight ${n.read ? "font-medium text-foreground/80" : "font-bold text-foreground"}`}>
                            {n.title}
                          </p>
                          {!n.read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-[10px] text-muted-foreground/60 cursor-help">{timeAgo(n.timestamp)}</span>
                            </TooltipTrigger>
                            <TooltipContent className="p-2" side="bottom">
                              <p className="text-xs text-popover-foreground">{exactDateTime(n.timestamp)}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-[14px] border-border/50">
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 mt-2 justify-end flex-wrap">
                      {n.issueUrl && (
                        <a
                          href={n.issueUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-[10px] h-6 px-2 font-medium text-primary hover:underline"
                        >
                          <ExternalLink className="w-3 h-3 mr-0.5" /> Report Issue
                        </a>
                      )}
                      {n.read ? (
                        <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={() => handleMarkUnread(n.id)}>
                          <Mail className="w-3 h-3 mr-0.5" /> Unread
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={() => handleMarkRead(n.id)}>
                          <MailOpen className="w-3 h-3 mr-0.5" /> Read
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 text-destructive hover:text-destructive" onClick={() => handleDelete(n.id)}>
                        <X className="w-3 h-3 mr-0.5" /> Remove
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Sub-components ----

function FilterChip({ active, onClick, children, count, unread }: { active: boolean; onClick: () => void; children: React.ReactNode; count?: number; unread?: number }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors font-medium flex items-center gap-1 ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className={`text-[9px] ${active ? "text-primary-foreground/70" : "text-muted-foreground/50"}`}>
          {count}
        </span>
      )}
      {unread !== undefined && unread > 0 && !active && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
      )}
    </button>
  );
}

function SettingRow({ label, icon: Icon, checked, onChange }: { label: string; icon: typeof Bell; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
