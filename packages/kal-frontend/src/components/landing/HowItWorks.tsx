import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const steps = [
  {
    number: "1",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: "Search",
    description: "Type any food name into our search bar",
  },
  {
    number: "2",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "View",
    description: "See calories, protein, carbs, and fat instantly",
  },
  {
    number: "3",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Track",
    description: "Know exactly what you're eating every day",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20">
      <Container>
        <SectionHeading
          title="How it works"
          subtitle="Get nutritional information in three simple steps"
        />

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              {/* Step number */}
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-dark-surface border border-dark-border flex items-center justify-center text-accent">
                  {step.icon}
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-dark text-sm font-bold flex items-center justify-center">
                  {step.number}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-content-primary mb-2">
                {step.title}
              </h3>
              <p className="text-content-secondary">
                {step.description}
              </p>

              {/* Connector line (not on last) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-px bg-dark-border -translate-y-1/2" />
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
