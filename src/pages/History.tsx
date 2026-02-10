import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Footprints, Clock, Star, Flame, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { getWalkHistory, getWalkingStats, deleteWalkEntry, type WalkEntry } from "@/lib/walking-history";
import logo from "@/assets/logo.png";

const History = () => {
  const [history, setHistory] = useState<WalkEntry[]>([]);
  const stats = getWalkingStats();

  useEffect(() => {
    setHistory(getWalkHistory());
  }, []);

  const handleDelete = (id: string) => {
    deleteWalkEntry(id);
    setHistory(getWalkHistory());
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container py-4 flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="w-5 h-5" />
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
          </Link>
          <span className="font-bold text-foreground">Walking History</span>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-card p-4 text-center">
            <Footprints className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{stats.totalSteps.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Steps</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Star className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-xl font-bold text-gradient-gold">{stats.totalHasanat.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Hasanat</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Flame className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{stats.currentStreak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{stats.totalWalks}</p>
            <p className="text-xs text-muted-foreground">Total Walks</p>
          </div>
        </div>

        {/* Distance & longest streak */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 text-center">
            <p className="text-lg font-bold text-foreground">{stats.totalDistance.toFixed(1)} km</p>
            <p className="text-xs text-muted-foreground">Total Distance</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-lg font-bold text-foreground">{stats.longestStreak} days</p>
            <p className="text-xs text-muted-foreground">Longest Streak</p>
          </div>
        </div>

        {/* Walk log */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Walk Log</h2>
          {history.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Footprints className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No walks recorded yet.</p>
              <Link to="/walk">
                <Button variant="hero" size="sm" className="mt-4">Start Your First Walk</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-teal flex items-center justify-center flex-shrink-0">
                      <Footprints className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{entry.mosqueName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs text-muted-foreground space-y-1">
                      <p>{entry.steps.toLocaleString()} steps</p>
                      <p className="text-gold">{entry.hasanat.toLocaleString()} hasanat</p>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      aria-label="Delete walk"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
