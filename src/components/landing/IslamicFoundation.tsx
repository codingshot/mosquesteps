import { motion } from "framer-motion";
import HadithTooltip, { VERIFIED_HADITHS } from "@/components/HadithTooltip";

const hadithKeys = ["ibnmajah_1412", "abudawud_561", "bukhari_636"] as const;

const hadiths = hadithKeys.map((key) => ({
  key,
  ...VERIFIED_HADITHS[key],
}));

const IslamicFoundation = () => {
  return (
    <section id="sunnah" className="py-20 bg-gradient-teal">
      <div className="container">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/70">
            Rooted in the Sunnah
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mt-2">
            Designed for Today, Guided by Tradition
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {hadiths.map((h, i) => (
            <motion.div
              key={h.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-card/10 backdrop-blur-sm rounded-xl p-6 border border-primary-foreground/10"
            >
              {h.arabic && (
                <p className="font-arabic text-lg text-primary-foreground/80 text-right leading-loose mb-4">
                  {h.arabic}
                </p>
              )}
              <HadithTooltip hadithKey={h.key} className="text-primary-foreground/90">
                <p className="text-sm text-primary-foreground/90 italic leading-relaxed mb-3">
                  "{h.shortText}"
                </p>
              </HadithTooltip>
              <a
                href={h.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-gold hover:underline"
                title="Open full hadith on Sunnah.com — Arabic, chain, and translations"
              >
                — {h.source} ↗
              </a>
              {h.grade && (
                <span className="text-xs text-primary-foreground/50 ml-2">
                  ({h.grade})
                </span>
              )}
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="https://sunnah.com/search?q=walking+to+mosque"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gold hover:underline"
            title="Search Sunnah.com for more hadiths about walking to the mosque"
          >
            Explore more hadiths on Sunnah.com →
          </a>
        </div>
      </div>
    </section>
  );
};

export default IslamicFoundation;
