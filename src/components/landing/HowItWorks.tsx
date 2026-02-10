import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Find Your Mosque",
    description: "Search for nearby mosques on the map and select your primary one.",
  },
  {
    number: "02",
    title: "Walk to Prayer",
    description: "See prayer times adjusted for walking time. Get notified when to leave.",
  },
  {
    number: "03",
    title: "Track Your Journey",
    description: "View estimated steps, distance, time, and the spiritual rewards you earn.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-2">
            Get Started in <span className="text-gradient-gold">3 Simple Steps</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center mx-auto mb-4 shadow-gold">
                <span className="text-xl font-bold text-foreground">{s.number}</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
