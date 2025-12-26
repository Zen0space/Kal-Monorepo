"use client";

import { BarChart2, Database, Sliders, Smartphone, Unlock, Zap } from "react-feather";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Instant Search",
    description: "Find any food in milliseconds with our fast search engine",
  },
  {
    icon: <BarChart2 className="w-6 h-6" />,
    title: "Macro Breakdown",
    description: "See detailed protein, carbohydrates, and fat information",
  },
  {
    icon: <Sliders className="w-6 h-6" />,
    title: "Serving Sizes",
    description: "Accurate portion information for precise tracking",
  },
  {
    icon: <Unlock className="w-6 h-6" />,
    title: "No Sign-up",
    description: "Use immediately without creating an account",
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "Mobile Friendly",
    description: "Works perfectly on any device, anywhere",
  },
  {
    icon: <Database className="w-6 h-6" />,
    title: "Growing Database",
    description: "New foods added regularly to expand our library",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20">
      <Container>
        <SectionHeading
          title="Everything you need"
          subtitle="Powerful features to help you track your nutrition effortlessly"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-xl bg-dark-surface border border-dark-border hover:border-accent/30 transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-dark border border-dark-border flex items-center justify-center text-accent mb-4 group-hover:bg-accent/10 group-hover:border-accent/30 transition-all duration-300">
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-content-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-content-secondary text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
