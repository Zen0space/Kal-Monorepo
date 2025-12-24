import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const stats = [
  { value: "500+", label: "Foods in database" },
  { value: "100%", label: "Free to use" },
  { value: "1 sec", label: "Average search time" },
];

export function Hero() {
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
            Know exactly what you eat
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-content-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Track calories and macros in seconds. Get insights that help you reach 
            your health goals — whether you&apos;re losing weight, building muscle, 
            or eating smarter.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button href="/search" size="lg">
              Start Searching — It&apos;s Free
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
            <Button href="#how-it-works" variant="secondary" size="lg">
              See How It Works
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-accent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-content-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
