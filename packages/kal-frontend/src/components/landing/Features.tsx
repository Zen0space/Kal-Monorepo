"use client";

import { Check, Code, Database, Globe, Lock, Zap } from "react-feather";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Fast REST API",
    description: "Lightning-fast responses with optimized endpoints for search and filtering",
  },
  {
    icon: <Database className="w-6 h-6" />,
    title: "Rich Food Data",
    description: "Access 100+ Malaysian foods with complete macro nutritional information",
  },
  {
    icon: <Check className="w-6 h-6" />,
    title: "Halal Certified",
    description: "JAKIM certified foods with verified brand and certification details",
  },
  {
    icon: <Code className="w-6 h-6" />,
    title: "Simple Integration",
    description: "Clean JSON responses that work with any language or framework",
  },
  {
    icon: <Lock className="w-6 h-6" />,
    title: "Free API Keys",
    description: "Get your API key instantly with generous rate limits",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Production Ready",
    description: "Reliable infrastructure built for your production applications",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20">
      <Container>
        <SectionHeading
          title="Everything you need"
          subtitle="Powerful API features to integrate Malaysian food data into your apps"
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
