import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const problems = [
  "Confusing nutrition labels",
  "Manual entry takes forever",
  "No idea what's in your food",
  "Apps that require sign-ups",
];

const solutions = [
  "Clear, simple nutritional data",
  "Instant search results",
  "Complete macro breakdown",
  "No account required",
];

export function ProblemSolution() {
  return (
    <section className="py-20">
      <Container>
        <SectionHeading
          title="Calorie tracking shouldn't be complicated"
          subtitle="We built Kal to make nutrition tracking simple and accessible for everyone"
        />

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Problems */}
          <div className="p-8 rounded-2xl bg-dark-surface border border-dark-border">
            <h3 className="text-lg font-semibold text-content-secondary mb-6 uppercase tracking-wide">
              The Problem
            </h3>
            <ul className="space-y-4">
              {problems.map((problem, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-sm">
                    ✕
                  </span>
                  <span className="text-content-secondary">{problem}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div className="p-8 rounded-2xl bg-dark-surface border border-accent/20">
            <h3 className="text-lg font-semibold text-accent mb-6 uppercase tracking-wide">
              The Solution
            </h3>
            <ul className="space-y-4">
              {solutions.map((solution, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm">
                    ✓
                  </span>
                  <span className="text-content-primary">{solution}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
