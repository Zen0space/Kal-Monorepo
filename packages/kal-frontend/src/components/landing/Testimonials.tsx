"use client";

import {
  AnimateIn,
  StaggerContainer,
  StaggerChild,
} from "@/components/ui/AnimateIn";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const testimonials = [
  {
    quote:
      "Finally, a calorie tracker that doesn't require a PhD to use. Just search and get the info you need.",
    author: "Sarah M.",
    role: "Health enthusiast",
    stars: 5,
  },
  {
    quote:
      "I use this every day to check my meals. Simple, fast, and accurate. Exactly what I needed.",
    author: "James T.",
    role: "Fitness coach",
    stars: 5,
  },
  {
    quote:
      "The fastest way to check what's in my food. No sign-ups, no hassle — just works.",
    author: "Lisa K.",
    role: "Home cook",
    stars: 5,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-1 mb-4">
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          className="w-4 h-4 text-accent"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="py-20">
      <Container>
        <AnimateIn>
          <SectionHeading
            title="Loved by health-conscious people"
            subtitle="See what our users are saying about Kal"
          />
        </AnimateIn>

        <StaggerContainer
          className="grid md:grid-cols-3 gap-6"
          staggerDelay={0.1}
        >
          {testimonials.map((testimonial, index) => (
            <StaggerChild key={index}>
              <div className="p-6 rounded-xl bg-dark-surface border border-dark-border relative overflow-hidden">
                {/* Top accent gradient line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

                {/* Stars */}
                <StarRating count={testimonial.stars} />

                {/* Quote */}
                <div className="mb-6">
                  <svg
                    className="w-8 h-8 text-accent/20 mb-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-content-secondary leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold ring-2 ring-accent/20">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-content-primary font-medium">
                      {testimonial.author}
                    </p>
                    <p className="text-content-muted text-sm">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerChild>
          ))}
        </StaggerContainer>
      </Container>
    </section>
  );
}
