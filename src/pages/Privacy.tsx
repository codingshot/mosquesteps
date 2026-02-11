import LegalLayout from "@/components/LegalLayout";
import SEOHead from "@/components/SEOHead";

const Privacy = () => (
  <LegalLayout title="Privacy Policy">
    <SEOHead
      title="Privacy Policy"
      description="How MosqueSteps handles your data. Location and step data stay on your device. No trackers."
      path="/privacy"
    />
    <p className="text-sm text-muted-foreground">Last updated: February 2026</p>

    <section>
      <h2 className="text-xl font-semibold text-foreground">1. Overview</h2>
      <p>
        MosqueSteps ("we", "our", "the app") is committed to protecting your privacy.
        This policy explains how we handle your information when you use our application.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
      <h3 className="text-lg font-medium text-foreground">Location Data</h3>
      <p>
        We request access to your device's location to calculate distances to mosques and
        provide prayer times based on your geographic position. Location data is processed
        locally on your device and is not transmitted to our servers.
      </p>
      <h3 className="text-lg font-medium text-foreground">Walking & Step Data</h3>
      <p>
        Step estimates are calculated locally based on GPS distance. Walking history is
        stored locally on your device using browser storage. We do not collect or transmit
        this data to any external servers.
      </p>
      <h3 className="text-lg font-medium text-foreground">Usage Data</h3>
      <p>
        We do not use analytics trackers, advertising pixels, or any third-party data
        collection services.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">3. Third-Party Services</h2>
      <p>MosqueSteps uses the following external APIs:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Aladhan API</strong> — for prayer time calculations (your coordinates are sent to retrieve prayer times)</li>
        <li><strong>OpenStreetMap / Overpass API</strong> — for mosque location data (your coordinates are sent to find nearby mosques)</li>
        <li><strong>Nominatim</strong> — for address geocoding when you search for a location</li>
      </ul>
      <p>
        These services have their own privacy policies. We recommend reviewing them for
        details on how they handle location queries.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">4. Data Storage</h2>
      <p>
        All user preferences, walking history, and settings are stored locally on your
        device using browser localStorage. No personal data is stored on external servers.
        You can clear all data at any time by clearing your browser data.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">5. Children's Privacy</h2>
      <p>
        MosqueSteps does not knowingly collect information from children under 13. The app
        is designed for general audiences and does not require account creation.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">6. Your Rights</h2>
      <p>
        Since all data is stored locally on your device, you have full control over your
        data. You can delete all stored data by clearing your browser's localStorage for
        this site.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">7. Changes to This Policy</h2>
      <p>
        We may update this policy from time to time. Changes will be reflected on this
        page with an updated revision date.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">8. Contact</h2>
      <p>
        If you have questions about this privacy policy, please reach out via the contact
        information on our website.
      </p>
    </section>
  </LegalLayout>
);

export default Privacy;
