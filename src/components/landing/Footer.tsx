import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

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

          {/* Also Known As */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Also Known As</h4>
            <p className="text-sm text-muted-foreground">
              MosqueSteps · SunnahSteps · PraySteps · SalatSteps
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} MosqueSteps. Built with faith and open-source technology.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
