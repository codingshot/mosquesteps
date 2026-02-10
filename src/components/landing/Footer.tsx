import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
              <span className="text-lg font-bold text-foreground">
                Mosque<span className="text-primary">Steps</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Turn every step into a blessing. Track your walk to the mosque and
              discover the spiritual rewards.
            </p>
          </div>

          {/* App */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">App</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              <li><Link to="/mosques" className="hover:text-primary transition-colors">Find Mosques</Link></li>
              <li><Link to="/rewards" className="hover:text-primary transition-colors">Rewards</Link></li>
              <li><Link to="/guides" className="hover:text-primary transition-colors">User Guides</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://sunnah.com/search?q=walking+to+mosque" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Sunnah References
                </a>
              </li>
              <li>
                <a href="https://aladhan.com/prayer-times-api" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Prayer Times API
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/legal" className="hover:text-primary transition-colors">Legal Info</Link></li>
            </ul>
          </div>
        </div>

        {/* Built by ummah.build */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} MosqueSteps. Built with faith and open-source technology.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://ummah.build"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-primary transition-colors"
            >
              Built by ummah.build
            </a>
            <a
              href="https://x.com/ummahbuild"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              aria-label="Follow ummah.build on X"
            >
              <XIcon />
            </a>
            <a
              href="https://www.linkedin.com/company/ummah-build/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              aria-label="Follow ummah.build on LinkedIn"
            >
              <LinkedInIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
