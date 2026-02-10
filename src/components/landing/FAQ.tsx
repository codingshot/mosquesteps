import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How does MosqueSteps estimate my steps?",
    a: "MosqueSteps calculates the distance between your location and the mosque using GPS coordinates, then estimates steps based on average stride length (~0.75m per step). For more accurate tracking, we use your device's motion sensors when available.",
  },
  {
    q: "How does the app know I'm going to the mosque?",
    a: "The app uses your saved mosque locations combined with prayer times and your proximity. You can also manually start and stop tracking for full control.",
  },
  {
    q: "Is my location data private?",
    a: "Yes. Your location data stays on your device. We don't share it with third parties. GPS is only used to calculate routes and prayer times.",
  },
  {
    q: "Are the hadith references authentic?",
    a: "Yes. Every hadith in the app comes from authenticated collections (Sahih Bukhari, Sahih Muslim, Sunan Abi Dawud, etc.) with proper citations and links to Sunnah.com.",
  },
  {
    q: "Does the app drain my battery?",
    a: "No. MosqueSteps uses efficient GPS queries only when calculating routes. Step estimation is done locally without continuous tracking.",
  },
  {
    q: "Can I add multiple mosques?",
    a: "Yes! You can search for and save multiple mosques, then select which one you're walking to for each prayer.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="py-20 bg-card">
      <div className="container">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-2">
            Common Questions
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="glass-card px-6 border-none"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
