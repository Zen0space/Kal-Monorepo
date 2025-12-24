import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const testimonials = [
  {
    quote: "Finally, a calorie tracker that doesn't require a PhD to use. Just search and get the info you need.",
    author: "Sarah M.",
    role: "Health enthusiast",
  },
  {
    quote: "I use this every day to check my meals. Simple, fast, and accurate. Exactly what I needed.",
    author: "James T.",
    role: "Fitness coach",
  },
  {
    quote: "The fastest way to check what's in my food. No sign-ups, no hassle — just works.",
    author: "Lisa K.",
    role: "Home cook",
  },
];

export function Testimonials() {
  return (
    <section className="py-20">
      <Container>
        <SectionHeading
          title="Loved by health-conscious people"
          subtitle="See what our users are saying about Kal"
        />

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-dark-surface border border-dark-border"
            >
              {/* Quote */}
              <div className="mb-6">
                <svg className="w-8 h-8 text-accent/30 mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-content-secondary leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <p className="text-content-primary font-medium">{testimonial.author}</p>
                  <p className="text-content-muted text-sm">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
