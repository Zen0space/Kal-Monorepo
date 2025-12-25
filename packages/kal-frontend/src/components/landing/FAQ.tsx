"use client";

import { useState } from "react";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const faqs = [
  {
    question: "Is Kal free to use?",
    answer: "Yes, Kal is completely free with no hidden costs. You can search our entire food database without paying anything.",
  },
  {
    question: "Do I need to create an account?",
    answer: "No, you don't need to sign up or create an account. Just start searching for foods immediately — no registration required.",
  },
  {
    question: "How accurate is the nutritional data?",
    answer: "Our database is carefully curated and regularly updated to ensure accuracy. We include verified nutritional information for each food item.",
  },
  {
    question: "Can I use Kal on my phone?",
    answer: "Absolutely! Kal is fully responsive and works beautifully on all devices — phones, tablets, and desktops.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20">
      <Container size="md">
        <SectionHeading
          title="Frequently asked questions"
          subtitle="Everything you need to know about Kal"
        />

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl bg-dark-surface border border-dark-border overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-dark-elevated/50 transition-colors"
              >
                <span className="font-medium text-content-primary">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-content-muted transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-content-secondary leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
