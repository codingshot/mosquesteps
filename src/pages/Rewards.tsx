import { Link } from "react-router-dom";
import { ArrowLeft, Star, Footprints, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const rewardHadiths = [
  {
    title: "Every Step Erases a Sin & Raises a Degree",
    text: "When one of you performs ablution well and goes out to the mosque, with no motive other than prayer, he does not take a step without being raised a degree and having one of his sins removed.",
    source: "Sahih Muslim 666",
    link: "https://sunnah.com/muslim:666",
  },
  {
    title: "Light on the Day of Resurrection",
    text: "Give glad tidings to those who walk to the mosques in darkness, of perfect light on the Day of Resurrection.",
    source: "Sunan Abi Dawud 561",
    link: "https://sunnah.com/abudawud:561",
  },
  {
    title: "Walk with Tranquility",
    text: "When the iqamah for prayer is called, do not come to it running, but come walking tranquilly with solemnity. Pray what you catch and complete what you miss.",
    source: "Sahih al-Bukhari 636",
    link: "https://sunnah.com/bukhari:636",
  },
  {
    title: "Greatest Steps in Reward",
    text: "The people who will receive the greatest reward for prayer are those who live farthest away, and then those who live farthest away.",
    source: "Sahih Muslim 662",
    link: "https://sunnah.com/muslim:662",
  },
  {
    title: "Reward Like Umrah",
    text: "Whoever purifies himself in his house, then comes to the mosque of Quba and prays in it, will have a reward like that of Umrah.",
    source: "Sunan Ibn Majah 1412",
    link: "https://sunnah.com/ibnmajah:1412",
  },
];

const Rewards = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-gold">
        <div className="container py-4 flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="w-5 h-5" />
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
          </Link>
          <span className="font-bold text-foreground">Spiritual Rewards</span>
        </div>
        <div className="container pb-8 text-center">
          <Star className="w-12 h-12 text-foreground mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-foreground">
            Every Step is a Blessing
          </h1>
          <p className="text-sm text-foreground/70 mt-2 max-w-md mx-auto">
            Based on authentic hadiths, each step toward the mosque earns you immense
            spiritual rewards. One step erases a sin, another raises you a degree.
          </p>
        </div>
      </header>

      <div className="container py-6 space-y-4">
        {/* Reward calculation */}
        <div className="glass-card p-5">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Footprints className="w-5 h-5 text-primary" /> How Rewards Are Calculated
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Each step <strong>to</strong> the mosque: 1 sin erased + 1 degree raised</p>
            <p>• Each step <strong>from</strong> the mosque: same rewards apply</p>
            <p>• Walking in darkness (Fajr/Isha): promised <strong>complete light</strong> on Judgment Day</p>
            <p>• Living farther = <strong>greater reward</strong> per journey</p>
          </div>
        </div>

        {/* Hadith cards */}
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" /> Hadith References
        </h2>
        {rewardHadiths.map((h, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5"
          >
            <h3 className="font-semibold text-foreground mb-2">{h.title}</h3>
            <p className="text-sm text-muted-foreground italic leading-relaxed mb-3">
              "{h.text}"
            </p>
            <a
              href={h.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-primary hover:underline"
            >
              — {h.source} ↗
            </a>
          </motion.div>
        ))}

        <div className="text-center py-4">
          <a
            href="https://sunnah.com/search?q=walking+to+mosque"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            Explore more on Sunnah.com →
          </a>
        </div>
      </div>
    </div>
  );
};

export default Rewards;
