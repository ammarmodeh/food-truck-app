import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <span className="font-bold text-lg text-foreground">Bye Bye Etiquette</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Gourmet street food that breaks the rules. Passion, quality, and flavor in every bite.
            </p>
          </div>

          {/* Links */}
          <div className="md:col-span-1">
            <h4 className="font-semibold text-foreground mb-3 text-sm">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/menu" className="text-muted-foreground hover:text-primary transition-colors">Menu</Link></li>
              <li><Link to="/schedule/week" className="text-muted-foreground hover:text-primary transition-colors">Schedule</Link></li>
              <li><Link to="/location" className="text-muted-foreground hover:text-primary transition-colors">Location</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div className="md:col-span-1">
            <h4 className="font-semibold text-foreground mb-3 text-sm">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/orders" className="text-muted-foreground hover:text-primary transition-colors">Your Orders</Link></li>
              <li><Link to="/cart" className="text-muted-foreground hover:text-primary transition-colors">Cart</Link></li>
              <li><Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">Login / Register</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-1">
            <h4 className="font-semibold text-foreground mb-3 text-sm">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span>📧</span> galaxy.fsllc@gmail.com
              </li>
              <li className="flex items-center gap-2">
                <span>📱</span> 8136475651
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>&copy; {currentYear} Bye Bye Etiquette. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="#" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="#" className="hover:text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;