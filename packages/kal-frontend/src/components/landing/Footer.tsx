import Link from "next/link";

import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="py-10 border-t border-dark-border">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-2.5 h-2.5 rounded-full bg-accent group-hover:scale-110 transition-transform" />
            <span className="text-lg font-semibold text-content-primary">Kal</span>
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
            © {new Date().getFullYear()} Kal. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
