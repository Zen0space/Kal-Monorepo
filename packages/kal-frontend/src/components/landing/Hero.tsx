"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { CountUp } from "@/components/ui/CountUp";
import { trpc } from "@/lib/trpc";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export function Hero() {
  const { data: stats } = trpc.food.stats.useQuery();
  const { data: logStats } = trpc.requestLogs.publicMonthlyStats.useQuery();

  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 relative">
      <Container size="md">
        <div className="text-center">
          {/* Logo */}
          <motion.div
            className="flex items-center justify-center gap-3 mb-6"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.05}
          >
            <div className="w-4 h-4 rounded-full bg-accent" />
            <span className="text-5xl md:text-6xl font-bold text-content-primary tracking-tight">
              Kal
            </span>
          </motion.div>

          {/* Headline — gradient text */}
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-content-primary via-content-primary to-accent bg-clip-text text-transparent"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
          >
            Malaysian Food Nutrition API
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-lg md:text-xl text-content-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.15}
          >
            Access comprehensive nutritional data for Malaysian foods. Build
            health apps, track calories, or integrate food data into your
            projects with our free REST API.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.2}
          >
            <Button href="/api-docs" size="lg">
              View API Documentation
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
            <Button href="/search" variant="secondary" size="lg">
              Try Food Search
            </Button>
          </motion.div>

          {/* Code Preview */}
          <motion.div
            className="max-w-2xl mx-auto mb-14"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.25}
          >
            <div className="code-window rounded-xl bg-dark-surface border border-dark-border overflow-hidden text-left hover:border-accent/20 transition-colors duration-300 glow-green-sm hover:glow-green-md">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-border">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-xs text-content-muted font-mono">
                  Terminal
                </span>
              </div>
              {/* Code content */}
              <div className="p-5 font-mono text-sm leading-relaxed overflow-x-auto">
                <div className="text-content-muted">
                  <span className="text-content-secondary">$</span>{" "}
                  <span className="text-accent">curl</span>{" "}
                  <span className="text-content-secondary">
                    https://api.kal.my/api/v1/foods/search
                  </span>{" "}
                  \
                </div>
                <div className="pl-4 text-content-muted">
                  <span className="text-yellow-400">-H</span>{" "}
                  <span className="text-emerald-300">
                    &quot;x-api-key: your_key&quot;
                  </span>{" "}
                  \
                </div>
                <div className="pl-4 text-content-muted">
                  <span className="text-yellow-400">-d</span>{" "}
                  <span className="text-emerald-300">
                    &apos;{`{"query": "nasi lemak"}`}&apos;
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-dark-border/50">
                  <span className="text-content-muted">{"// "}</span>
                  <span className="text-accent">200 OK</span>
                  <span className="text-content-muted">
                    {" — "}
                    calories, protein, carbs, fat &amp; more
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="max-w-xl mx-auto"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.3}
          >
            <div className="grid grid-cols-3 gap-6 bg-dark-surface/60 backdrop-blur-sm border border-dark-border rounded-2xl p-6 glow-green-sm">
              {/* Foods Count */}
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-accent mb-1 h-9 flex items-center justify-center">
                  {stats?.total ? (
                    <CountUp value={stats.total} />
                  ) : (
                    <span className="animate-pulse text-content-muted">
                      ...
                    </span>
                  )}
                </div>
                <div className="text-sm text-content-muted">Foods</div>
              </div>

              {/* Halal Foods Count */}
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-accent mb-1 h-9 flex items-center justify-center">
                  {stats?.halal ? (
                    <CountUp value={stats.halal} />
                  ) : (
                    <span className="animate-pulse text-content-muted">
                      ...
                    </span>
                  )}
                </div>
                <div className="text-sm text-content-muted">
                  Halal Certified
                </div>
              </div>

              {/* Requests This Month */}
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-accent mb-1 h-9 flex items-center justify-center">
                  {logStats?.successfulRequests != null ? (
                    <CountUp value={logStats.successfulRequests} />
                  ) : (
                    <span className="animate-pulse text-content-muted">
                      ...
                    </span>
                  )}
                </div>
                <div className="text-sm text-content-muted">
                  Requests This Month
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
