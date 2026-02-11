import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";
import { guides } from "@/lib/guides-data";

const GuidesCarousel = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="text-center mb-10">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            User Guides
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-2">
            Learn How to Use <span className="text-gradient-gold">MosqueSteps</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Step-by-step tutorials to help you get the most out of every walk.
          </p>
        </div>

        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-4" style={{ minWidth: "max-content" }}>
            {guides.map((guide, i) => (
              <motion.div
                key={guide.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="w-[220px] flex-shrink-0"
              >
                <Link
                  to={`/guides/${guide.id}`}
                  className="glass-card overflow-hidden hover:shadow-teal transition-shadow group block h-full"
                >
                  <div className="bg-gradient-teal p-4 flex items-center justify-center">
                    <span className="text-4xl">{guide.iconEmoji}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors mb-1">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {guide.description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                      Read Guide <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            to="/guides"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <BookOpen className="w-4 h-4" />
            View All Guides <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default GuidesCarousel;
