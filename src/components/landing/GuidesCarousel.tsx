import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { guides } from "@/lib/guides-data";

const DURATION = 50; // seconds for one full loop

const GuidesCarousel = () => {
  const duplicated = [...guides, ...guides];

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

        <div className="w-full overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
          <div
            className="flex gap-4 py-2 guides-carousel-track"
            style={{
              width: "max-content",
              animation: `guides-scroll ${DURATION}s linear infinite`,
            }}
          >
            {duplicated.map((guide, i) => (
              <div
                key={`${guide.id}-${i}`}
                className="flex-shrink-0 w-[220px]"
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
              </div>
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
