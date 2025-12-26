"use client";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { TypewriterNumber } from "@/components/ui/TypewriterNumber";
import { trpc } from "@/lib/trpc";

export function Hero() {
  const { data: stats } = trpc.food.stats.useQuery();

  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28">
      <Container size="md">
        <div className="text-center animate-fade-in">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-4 h-4 rounded-full bg-accent" />
            <span className="text-5xl md:text-6xl font-bold text-content-primary tracking-tight">
              Kal
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-content-primary mb-6 leading-tight">
            Malaysian Food Nutrition API
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-content-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Access comprehensive nutritional data for Malaysian foods. 
            Build health apps, track calories, or integrate food data into your projects 
            with our free REST API.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button href="/api-docs" size="lg">
              View API Documentation
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
            <Button href="/search" variant="secondary" size="lg">
              Try Food Search
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {/* Dynamic Food Count */}
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-accent mb-1 h-9 flex items-center justify-center">
                {stats?.total ? (
                  <TypewriterNumber value={stats.total} suffix="+" />
                ) : (
                  <span className="animate-pulse">...</span>
                )}
              </div>
              <div className="text-sm text-content-muted">
                Malaysian Foods
              </div>
            </div>

            {/* Static Stats */}
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-accent mb-1">
                Free
              </div>
              <div className="text-sm text-content-muted">
                API Access
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-accent mb-1">
                &lt;50ms
              </div>
              <div className="text-sm text-content-muted">
                Response Time
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
