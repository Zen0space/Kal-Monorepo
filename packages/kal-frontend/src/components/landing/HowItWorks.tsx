"use client";

import { BarChart2, CheckCircle, Search } from "react-feather";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const steps = [
  {
    number: "1",
    icon: <Search className="w-8 h-8" />,
    title: "Search",
    description: "Type any food name into our search bar",
  },
  {
    number: "2",
    icon: <BarChart2 className="w-8 h-8" />,
    title: "View",
    description: "See calories, protein, carbs, and fat instantly",
  },
  {
    number: "3",
    icon: <CheckCircle className="w-8 h-8" />,
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
