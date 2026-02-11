import { motion } from "framer-motion";

const ProblemSolution = () => {
  return (
    <section className="py-20 islamic-pattern">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Problem */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <span className="text-sm font-semibold uppercase tracking-widest text-accent">
              The Opportunity
            </span>
            <h2 className="text-3xl font-bold text-foreground">
              You're Already Walking to the Mosque. Are You Aware of the Immense Rewards?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Every day, millions of Muslims walk to their local mosque for prayer. 
              But most don't realize the incredible spiritual rewards earned with each step. 
              What if you could see these blessings? Track them? Be reminded of them every single day?
            </p>
          </motion.div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              The Solution
            </span>
            <h2 className="text-3xl font-bold text-foreground">
              MosqueSteps: Your Companion for the Walk to Prayer
            </h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">📊</span>
                <span><strong>Track every step</strong> you take to and from the mosque</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">⏰</span>
                <span><strong>Prayer times adjusted</strong> for your walking duration</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">✨</span>
                <span><strong>Visualize spiritual rewards</strong> based on authentic hadiths</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">🔥</span>
                <span><strong>Build consistent habits</strong> with streaks and reminders</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">📚</span>
                <span><strong>Learn the <a href="https://sunnah.com/search?q=walking+to+mosque" target="_blank" rel="noopener noreferrer" className="text-primary underline" title="Search Sunnah.com for hadiths about walking to the mosque">Sunnah</a></strong> of walking to prayer</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
