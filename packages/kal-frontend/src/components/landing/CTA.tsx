import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function FinalCTA() {
  return (
    <section className="py-20">
      <Container size="sm">
        <div className="text-center p-10 md:p-14 rounded-2xl bg-dark-surface border border-dark-border">
          <h2 className="text-3xl md:text-4xl font-bold text-content-primary mb-4">
            Ready to eat smarter?
          </h2>
          <p className="text-content-secondary text-lg mb-8 max-w-md mx-auto">
            Start tracking your nutrition today — no sign-up required.
          </p>
          <Button href="/search" size="lg">
            Search Foods Now
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Button>
        </div>
      </Container>
    </section>
  );
}
