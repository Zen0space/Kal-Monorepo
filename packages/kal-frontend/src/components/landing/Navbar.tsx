"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "react-feather";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
  { label: "API", href: "/api-docs" },
];

interface NavbarProps {
  onSignIn?: () => Promise<void>;
}

export function Navbar({ onSignIn }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/80 backdrop-blur-md border-b border-dark-border">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-3 h-3 rounded-full bg-accent group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold text-content-primary">Kal</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-content-secondary hover:text-content-primary transition-colors text-sm"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button
              onClick={() => onSignIn?.()}
              href={onSignIn ? undefined : "/search"}
              size="sm"
            >
              Sign In
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-content-secondary hover:text-content-primary"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-dark-border">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-content-secondary hover:text-content-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4">
              <Button
                onClick={() => onSignIn?.()}
                href={onSignIn ? undefined : "/search"}
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          </div>
        )}
      </Container>
    </nav>
  );
}
