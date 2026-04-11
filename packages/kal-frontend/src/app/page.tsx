import { getLogtoContext, signIn } from "@logto/next/server-actions";

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
import { PwaAuthRedirect } from "@/components/PwaAuthRedirect";
import { getLogtoConfig } from "@/lib/logto";

export default async function LandingPage() {
  const config = getLogtoConfig();
  const { isAuthenticated } = await getLogtoContext(config);

  const onSignIn = async () => {
    "use server";
    const config = getLogtoConfig();
    await signIn(config);
  };

  // Authenticated users: server-render the splash screen (breathing icon)
  // so it's visible from first paint — before any JS loads.
  // PwaAuthRedirect layers on top after hydration:
  //   - PWA (standalone): keeps splash visible, redirects to /dashboard
  //   - Desktop/browser: hides splash, reveals the landing page fallback
  if (isAuthenticated) {
    return (
      <main className="min-h-screen bg-dark relative overflow-hidden">
        {/* Server-rendered splash — visible from first paint, no JS needed */}
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-dark">
          <img
            src="/assets/icon-svg.svg"
            alt=""
            width={80}
            height={80}
            className="animate-breathe"
            style={{ filter: "drop-shadow(0 0 24px rgba(16,185,129,0.3))" }}
          />
        </div>

        {/* Client component takes over after hydration (z-50 sits above z-40) */}
        <PwaAuthRedirect isAuthenticated fallback={
          <>
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
              <div className="absolute top-0 transform -translate-x-1/2 left-1/2 w-[1000px] h-[500px] bg-accent/5 blur-[120px] rounded-full animate-float-slow" />
              <div className="absolute bottom-0 transform translate-x-1/2 right-1/2 w-[800px] h-[600px] bg-accent/5 blur-[120px] rounded-full animate-float-slower" />
              <div className="absolute inset-0 dot-grid" />
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-accent/[0.07] to-transparent" />
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
          </>
        } />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-dark relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Animated gradient blobs */}
        <div className="absolute top-0 transform -translate-x-1/2 left-1/2 w-[1000px] h-[500px] bg-accent/5 blur-[120px] rounded-full animate-float-slow" />
        <div className="absolute bottom-0 transform translate-x-1/2 right-1/2 w-[800px] h-[600px] bg-accent/5 blur-[120px] rounded-full animate-float-slower" />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 dot-grid" />
        {/* Center gradient line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-accent/[0.07] to-transparent" />
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
