import { motion } from "framer-motion";

const hadiths = [
  {
    arabic: "مَنْ تَطَهَّرَ فِي بَيْتِهِ ثُمَّ مَشَى إِلَى بَيْتٍ مِنْ بُيُوتِ اللَّهِ",
    translation:
      "Whoever purifies himself in his house, then comes to the mosque of Quba and prays in it, will have a reward like that of Umrah.",
    source: "Sunan Ibn Majah",
    link: "https://sunnah.com/ibnmajah:1412",
  },
  {
    arabic: "بَشِّرِ الْمَشَّائِينَ فِي الظُّلَمِ إِلَى الْمَسَاجِدِ بِالنُّورِ التَّامِّ يَوْمَ الْقِيَامَةِ",
    translation:
      "Give glad tidings to those who walk to the mosques in darkness, of perfect light on the Day of Resurrection.",
    source: "Sunan Abi Dawud",
    link: "https://sunnah.com/abudawud:561",
  },
  {
    arabic: "إِذَا أُقِيمَتِ الصَّلاَةُ فَلاَ تَأْتُوهَا تَسْعَوْنَ وَأْتُوهَا تَمْشُونَ وَعَلَيْكُمُ السَّكِينَةُ",
    translation:
      "When the iqamah for prayer is called, do not come to it running, but come walking tranquilly with solemnity.",
    source: "Sahih al-Bukhari 636",
    link: "https://sunnah.com/bukhari:636",
  },
];

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
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-card/10 backdrop-blur-sm rounded-xl p-6 border border-primary-foreground/10"
            >
              <p className="font-arabic text-lg text-primary-foreground/80 text-right leading-loose mb-4">
                {h.arabic}
              </p>
              <p className="text-sm text-primary-foreground/90 italic leading-relaxed mb-3">
                "{h.translation}"
              </p>
              <a
                href={h.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-gold hover:underline"
              >
                — {h.source} ↗
              </a>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="https://sunnah.com/search?q=walking+to+mosque"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gold hover:underline"
          >
            Explore more hadiths on Sunnah.com →
          </a>
        </div>
      </div>
    </section>
  );
};

export default IslamicFoundation;
