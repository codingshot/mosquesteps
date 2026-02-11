import LegalLayout from "@/components/LegalLayout";
import SEOHead from "@/components/SEOHead";

const Legal = () => (
  <LegalLayout title="Legal Information">
    <SEOHead
      title="Legal Information"
      description="Open source attributions, disclaimers, and legal information for MosqueSteps."
      path="/legal"
    />
    <p className="text-sm text-muted-foreground">Last updated: February 2026</p>

    <section>
      <h2 className="text-xl font-semibold text-foreground">About MosqueSteps</h2>
      <p>
        MosqueSteps is an open-source progressive web application designed to help
        Muslims track their walks to the mosque and learn about the spiritual rewards
        of this practice as described in authentic Islamic sources.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">Open Source Attributions</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>OpenStreetMap</strong> — Map tiles and data © OpenStreetMap contributors,
          licensed under the Open Data Commons Open Database License (ODbL).
          <br />
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            openstreetmap.org/copyright
          </a>
        </li>
        <li>
          <strong>Aladhan Prayer Times API</strong> — Prayer time calculations provided by
          the Aladhan API, a free Islamic prayer times service.
          <br />
          <a href="https://aladhan.com/prayer-times-api" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            aladhan.com/prayer-times-api
          </a>
        </li>
        <li>
          <strong>Sunnah.com</strong> — Hadith references and translations sourced from
          Sunnah.com, a project of the Sunnah.com Foundation.
          <br />
          <a href="https://sunnah.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            sunnah.com
          </a>
        </li>
        <li>
          <strong>Leaflet</strong> — Open-source JavaScript library for interactive maps,
          licensed under BSD-2-Clause.
        </li>
        <li>
          <strong>Overpass API</strong> — Query engine for OpenStreetMap data, used to find
          nearby mosques.
        </li>
        <li>
          <strong>Nominatim</strong> — OpenStreetMap geocoding service for location search.
        </li>
        <li>
          <strong>OSRM</strong> — Open Source Routing Machine; walking route and turn-by-turn directions
          (router.project-osrm.org).
        </li>
        <li>
          <strong>TimeAPI</strong> — Timezone detection by coordinates (timeapi.io).
        </li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">Islamic Content Disclaimer</h2>
      <p>
        The Islamic content in MosqueSteps, including hadith references and spiritual reward
        calculations, is provided for educational and motivational purposes. All hadiths are
        sourced from authenticated collections and include proper citations with links to{" "}
        <a href="https://sunnah.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
          Sunnah.com
        </a>{" "}
        for verification.
      </p>
      <p>
        The hasanat (good deeds) calculations are illustrative representations based on hadith
        teachings. For specific religious rulings, please consult qualified Islamic scholars.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground">Related Pages</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <a href="/privacy" className="text-primary underline">Privacy Policy</a>
        </li>
        <li>
          <a href="/terms" className="text-primary underline">Terms of Service</a>
        </li>
      </ul>
    </section>
  </LegalLayout>
);

export default Legal;
