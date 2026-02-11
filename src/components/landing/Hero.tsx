import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import HadithTooltip from "@/components/HadithTooltip";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 sm:pt-20 md:pt-16 overflow-hidden bg-gradient-hero">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Walking toward a mosque at sunrise"
          className="w-full h-full object-cover opacity-20"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
      </div>

      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-4">
              Count Every Step to the Mosque as a Blessing
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground mb-6">
              Walk in the Footsteps of the{" "}
              <span className="text-gradient-gold">Righteous</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed">
              The Prophet ﷺ said:{" "}
              <HadithTooltip hadithKey="muslim_666" className="text-muted-foreground">
                <em>
                  "Whoever purifies himself in his house then walks to one of the
                  houses of Allah to perform an obligatory prayer, one step will
                  erase a sin and another will raise him a degree."
                </em>
              </HadithTooltip>
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              — <a href="https://sunnah.com/muslim:666" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary" title="Open Sahih Muslim 666 on Sunnah.com — each step erases a sin and raises a degree">Sahih Muslim 666</a>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/dashboard">
              <Button variant="hero" size="lg" className="text-base px-8">
                Start Your Blessed Journey
              </Button>
            </Link>
            <a href="#features">
              <Button variant="hero-outline" size="lg" className="text-base px-8">
                Learn More
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground"
          >
            <span>👣 Step Tracking</span>
            <span>🕌 Prayer Times</span>
            <span>⭐ Spiritual Rewards</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
