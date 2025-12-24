import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { SampleFoods } from "@/components/landing/SampleFoods";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-dark relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 transform -translate-x-1/2 left-1/2 w-[1000px] h-[500px] bg-accent/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 transform translate-x-1/2 right-1/2 w-[800px] h-[600px] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      <Navbar />
      <Hero />
      <ProblemSolution />
      <HowItWorks />
      <Features />
      <SampleFoods />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
