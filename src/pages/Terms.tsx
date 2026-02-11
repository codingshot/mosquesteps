import LegalLayout from "@/components/LegalLayout";
import SEOHead from "@/components/SEOHead";

const Terms = () => (
  <LegalLayout title="Terms of Service">
    <SEOHead
      title="Terms of Service"
      description="Terms of use for MosqueSteps. Free app for tracking walks to the mosque and spiritual rewards."
      path="/terms"
    />
    <p className="text-sm text-muted-foreground">Last updated: February 2026</p>

    <section>
      <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
      <p>
        By accessing and using MosqueSteps ("the app"), you agree to be bound by these
        Terms of Service. If you do not agree, please do not use the app.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
      <p>
        MosqueSteps is a free web application that estimates walking steps and distance
        to mosques, displays prayer times, and provides Islamic educational content about
        the spiritual rewards of walking to the mosque.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">3. Accuracy Disclaimer</h2>
      <p>
        Step counts and distances are <strong>estimates</strong> based on GPS coordinates
        and average stride calculations. They should not be relied upon for medical,
        health, or fitness purposes. Prayer times are sourced from the Aladhan API and
        may vary from your local mosque's schedule.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">4. Islamic Content</h2>
      <p>
        All hadith references in the app are sourced from authenticated collections
        (Sahih Bukhari, Sahih Muslim, Sunan Abi Dawud, Sunan Ibn Majah) and link to{" "}
        <a href="https://sunnah.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
          Sunnah.com
        </a>{" "}
        for verification. The spiritual reward calculations (hasanat) are illustrative
        representations based on hadith teachings and should not be considered definitive
        religious rulings.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">5. User Responsibilities</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Use the app responsibly and in accordance with local laws</li>
        <li>Do not rely solely on the app for prayer time accuracy — verify with your local mosque</li>
        <li>Exercise caution when walking and always prioritize personal safety</li>
        <li>Do not use the app while driving or operating vehicles</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">6. Intellectual Property</h2>
      <p>
        The MosqueSteps name, logo, and original content are the property of MosqueSteps.
        Islamic texts and hadiths are part of the public Islamic scholarly tradition.
        Map data is provided by OpenStreetMap contributors under the ODbL license.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">7. Limitation of Liability</h2>
      <p>
        MosqueSteps is provided "as is" without warranties of any kind. We are not liable
        for any damages arising from the use of the app, including but not limited to
        inaccurate step counts, prayer times, or mosque locations.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">8. Changes to Terms</h2>
      <p>
        We reserve the right to modify these terms at any time. Continued use of the app
        after changes constitutes acceptance of the modified terms.
      </p>
    </section>
  </LegalLayout>
);

export default Terms;
