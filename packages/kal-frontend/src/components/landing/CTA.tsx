"use client";

import { AnimateIn } from "@/components/ui/AnimateIn";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function FinalCTA() {
  return (
    <section className="py-20">
      <Container size="sm">
        <AnimateIn>
          <div className="text-center p-10 md:p-14 rounded-2xl bg-gradient-to-b from-dark-surface to-dark-surface/80 border border-accent/20 relative overflow-hidden glow-green-md">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

            <h2 className="text-3xl md:text-4xl font-bold text-content-primary mb-4">
              Ready to build?
            </h2>
            <p className="text-content-secondary text-lg mb-8 max-w-md mx-auto">
              Get your free API key and start integrating Malaysian food data
              today.
            </p>
            <Button href="/api-docs" size="lg">
              Get Started with the API
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Button>
          </div>
        </AnimateIn>
      </Container>
    </section>
  );
}
