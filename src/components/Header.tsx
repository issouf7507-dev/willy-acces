import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { usePreorder } from "../context/PreorderContext";
import Logo from "./Logo";
import SearchOverlay from "./SearchOverlay";
import AccountMenu from "./AccountMenu";

const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "Produits", href: "/products" },
  { label: "Nouveautés", href: "/collections/new-arrivals" },
  { label: "Précommandes", href: "/collections/produits-a-venir" },
  { label: "Salon de beauté", href: "/salon-de-beaute" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { openCart, itemCount } = useCart();
  // Le panier de précommande n'apparaît que s'il contient quelque chose : sans
  // réservation en cours, l'icône n'aurait rien à ouvrir.
  const { openCart: openPreorderCart, itemCount: preorderCount } = usePreorder();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-5 md:px-12">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Hamburger - mobile */}
          <button
            className="lg:hidden p-2 -ml-2 hover:opacity-60 transition-opacity"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {menuOpen ? (
                <>
                  <path d="M3 3l16 16M3 19L19 3" />
                </>
              ) : (
                <>
                  <path d="M1 5h20M1 11h20M1 17h20" />
                </>
              )}
            </svg>
          </button>

          {/* Logo */}
          <Link
            to="/"
            className="flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2.5"
            aria-label="Willy Accessoires — accueil"
          >
            <Logo className="h-11 md:h-14" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-bold uppercase tracking-wide hover:opacity-60 transition-opacity"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-1">
            {/* Recherche : visible aussi sur mobile, c'est le chemin le plus
                court vers un produit quand la nav est repliée. */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex p-2 hover:opacity-60 transition-opacity"
              aria-label="Rechercher"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="10" r="7" />
                <path
                  d="m16 15 3 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <AccountMenu />

            {preorderCount > 0 && (
              <button
                onClick={openPreorderCart}
                className="relative p-2 hover:opacity-60 transition-opacity"
                aria-label="Ouvrir mes précommandes"
                title="Mes précommandes"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 14" />
                </svg>
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-black text-white text-[10px] rounded-full flex items-center justify-center font-bold px-0.5">
                  {preorderCount}
                </span>
              </button>
            )}

            {/* Cart button — branché au context */}
            <button
              onClick={openCart}
              className="relative p-2 hover:opacity-60 transition-opacity"
              aria-label="Ouvrir le panier"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 7H3.577A2 2 0 0 0 1.64 9.497l2.051 8A2 2 0 0 0 5.63 19H16.37a2 2 0 0 0 1.937-1.503l2.052-8A2 2 0 0 0 18.422 7H11Zm0 0V1" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-black text-white text-[10px] rounded-full flex items-center justify-center font-bold px-0.5">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-zinc-200 bg-white">
          <nav className="px-5 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-xl font-black uppercase tracking-wide py-3 border-b border-zinc-100 hover:opacity-60 transition-opacity"
              >
                {link.label}
              </Link>
            ))}
            {/* Le menu compte est réservé au desktop : sur mobile ses entrées
                vivent ici, où il y a la place de les nommer. */}
            <Link
              to="/faq"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-bold uppercase tracking-widest py-3 text-zinc-500 hover:text-black transition-colors"
            >
              Aide &amp; FAQ
            </Link>
            <Link
              to="/inscription"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-bold uppercase tracking-widest pb-3 text-zinc-500 hover:text-black transition-colors"
            >
              S'inscrire
            </Link>
          </nav>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
