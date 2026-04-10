"use client";

import Link from "next/link";

import { AnimateIn } from "@/components/ui/AnimateIn";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="py-10 border-t border-dark-border">
      <Container>
        <AnimateIn>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Logo
                size={24}
                className="group-hover:scale-110 transition-transform"
              />
            </Link>

            {/* Legal Links */}
            <div className="flex gap-6 text-sm text-content-muted">
              <Link
                href="/privacy"
                className="hover:text-accent transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-accent transition-colors"
              >
                Terms of Service
              </Link>
            </div>

            {/* Copyright */}
            <p className="text-content-muted text-sm">
              &copy; {new Date().getFullYear()} Kal. All rights reserved.
            </p>
          </div>
        </AnimateIn>
      </Container>
    </footer>
  );
}
