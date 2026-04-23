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

export default function Footer() {
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
                <a href="mailto:footbooking.sn@gmail.com?subject=Bienvenue, comment pouvons-nous vous aider ?&body=FootBooking vous accompagne pour toutes vos réservations de terrains.">contact@footbooking.sn</a>
              </li>

              <li className="flex items-center gap-2">
                <Phone className="text-primary w-4 h-4" />
                <a href="tel:+221760263631">+221 76 026 36 31</a>
              </li>
            </ul>
            {/* https://www.instagram.com/footbooking */}
            {/* https://www.tiktok.com/@footbooking221?_r=1&_t=ZN-95mlngwTKZK */}
            {/* SOCIAL */}
            <div className="flex gap-3 mt-2">
              <a className="size-10 rounded-full bg-[#2e2318] flex items-center justify-center text-text-secondary hover:bg-primary hover:text-[#231a10] transition-colors"
                href="https://www.instagram.com/footbooking">
                <Instagram />
              </a>
              <a className="size-10 rounded-full bg-[#2e2318] flex items-center justify-center text-text-secondary hover:bg-primary hover:text-[#231a10] transition-colors"
                href="https://www.tiktok.com/@footbooking221?_r=1&_t=ZN-95mlngwTKZK">
                <i class="fa-brands fa-tiktok fa-lg" 
                  style={{color: "rgb(203, 173, 144)"}}>
                </i>
              </a>
            </div>
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
