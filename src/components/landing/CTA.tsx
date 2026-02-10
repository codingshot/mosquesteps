import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-hero">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Every Step Counts. Start Tracking Today.
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join Muslims transforming their daily walk into a spiritual journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard">
              <Button variant="hero" size="lg" className="text-base px-10">
                Start Your Blessed Journey
              </Button>
            </Link>
            <Link to="/mosques">
              <Button variant="hero-outline" size="lg" className="text-base px-10">
                Find Nearby Mosques
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <span>🔒 Privacy-First</span>
            <span>📚 Verified Islamic Content</span>
            <span>🌍 Open Source Maps</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
