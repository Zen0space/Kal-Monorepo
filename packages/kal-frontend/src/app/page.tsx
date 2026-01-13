import { signIn } from "@logto/next/server-actions";

import { FinalCTA } from "@/components/landing/CTA";
import { FAQ } from "@/components/landing/FAQ";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Navbar } from "@/components/landing/Navbar";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { SampleFoods } from "@/components/landing/SampleFoods";
import { Testimonials } from "@/components/landing/Testimonials";
import { getLogtoConfig } from "@/lib/logto";

export default async function LandingPage() {
  const onSignIn = async () => {
    "use server";
    const config = getLogtoConfig();
    await signIn(config);
  };

  return (
    <main className="min-h-screen bg-dark relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 transform -translate-x-1/2 left-1/2 w-[1000px] h-[500px] bg-accent/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 transform translate-x-1/2 right-1/2 w-[800px] h-[600px] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      <Navbar onSignIn={onSignIn} />
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
