import React from "react";
import { Link } from "react-router-dom";
import mainLogo from "../assets/img/mainLogo.png";
import {
  MapPin,
  Mail,
  Phone,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";
import { usePlatform } from "../context/PlatformContext";

export default function Footer() {
  const { contactEmail } = usePlatform();
  return (
    <footer className="w-full bg-[#1a130c] border-t border-surface-highlight pt-16 pb-8 px-6 sm:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto">
        {/* TOP FOOTER */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          {/* LOGO + DESCRIPTION */}
          <div className="flex flex-col gap-2 max-w-xs">
            <Link to="/" className="inline-block">
              <img
                src={mainLogo}
                alt="Footbooking"
                className="h-16 md:h-20 w-auto object-contain"
              />
            </Link>

            <p className="text-text-secondary text-sm leading-relaxed">
              Réservez facilement vos terrains de football à Dakar. Rapide,
              simple et fiable.
            </p>
          </div>

          {/* NAVIGATION */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-semibold text-lg">Navigation</h3>
            <ul className="flex flex-col gap-3 text-text-secondary text-sm">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  to="/search"
                  className="hover:text-primary transition-colors"
                >
                  Trouver un terrain
                </Link>
              </li>
              <li>
                <Link
                  to="/owners"
                  className="hover:text-primary transition-colors"
                >
                  Espace Propriétaire
                </Link>
              </li>
            </ul>
          </div>
          {/* CONTACT */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-semibold text-lg">Contact</h3>

            <ul className="flex flex-col gap-3 text-text-secondary text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="text-primary w-4 h-4" />
                Dakar, Sénégal
              </li>

              <li className="flex items-center gap-2">
                <Mail className="text-primary w-4 h-4" />
                  <a href={`mailto:${contactEmail}?subject=Bienvenue, comment pouvons-nous vous aider ?&body=FootBooking vous accompagne pour toutes vos réservations de terrains.`}>{contactEmail}</a>
              </li>

              <li className="flex items-center gap-2">
                <Phone className="text-primary w-4 h-4" />
                <a href="tel:+221760263631">+221 76 026 36 31</a>
              </li>
            </ul>

            {/* SOCIAL */}
            {/* <div className="flex gap-3 mt-2">
              <a
                className="size-10 rounded-full bg-[#2e2318] flex items-center justify-center text-text-secondary hover:bg-primary hover:text-[#231a10] transition-colors"
                href="#"
              >
                <svg
                  aria-hidden="true"
                  className="size-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path>
                </svg>
              </a>
              <a
                className="size-10 rounded-full bg-[#2e2318] flex items-center justify-center text-text-secondary hover:bg-primary hover:text-[#231a10] transition-colors"
                href="#"
              >
                <svg
                  aria-hidden="true"
                  className="size-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465 1.067-.047 1.409-.06 3.809-.06s2.783.013 3.809.06zm-1.983 4.927a3.076 3.076 0 100 6.152 3.076 3.076 0 000-6.152zM17.153 8.16a1.165 1.165 0 11-2.33 0 1.165 1.165 0 012.33 0zm-8.82 8.357a5.365 5.365 0 1110.73 0 5.365 5.365 0 01-10.73 0z"></path>
                </svg>
              </a>
            </div> */}
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER */}
      <div className="border-t border-surface-highlight mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[#684d31] text-xs text-center md:text-left">
          © 2026 Footbooking — Tous droits réservés
        </p>

        <div className="flex gap-6 text-[#684d31] text-xs">
          <a href="#" className="hover:text-text-secondary">
            Français
          </a>

          <a href="#" className="hover:text-text-secondary">
            Wolof
          </a>
        </div>
      </div>
    </footer>
  );
}
