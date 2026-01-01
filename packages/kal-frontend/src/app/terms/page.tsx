import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Kalori API - Malaysian Food Nutrition Database & API",
};

export default function TermsOfServicePage() {
  const lastUpdated = "1 January 2026";
  const effectiveDate = "1 January 2026";

  return (
    <main className="min-h-screen bg-dark relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 transform -translate-x-1/2 left-1/2 w-[1000px] h-[500px] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="py-6 border-b border-dark-border relative z-10">
        <Container>
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-2.5 h-2.5 rounded-full bg-accent group-hover:scale-110 transition-transform" />
              <span className="text-lg font-semibold text-content-primary">
                Kal
              </span>
            </Link>
            <Link
              href="/"
              className="text-content-secondary hover:text-accent transition-colors text-sm"
            >
              ← Back to Home
            </Link>
          </div>
        </Container>
      </header>

      {/* Content */}
      <section className="py-16 relative z-10">
        <Container>
          <div className="max-w-4xl mx-auto">
            {/* Title */}
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-content-primary mb-4">
                Terms of Service
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-content-muted">
                <p>
                  <strong>Last Updated:</strong> {lastUpdated}
                </p>
                <p>
                  <strong>Effective Date:</strong> {effectiveDate}
                </p>
              </div>
            </div>

            {/* Content Sections */}
            <div className="legal-content space-y-10">
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  1. Introduction
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    Welcome to Kalori API (&quot;Service&quot;,
                    &quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, or
                    &quot;our&quot;). These Terms of Service (&quot;Terms&quot;)
                    govern your access to and use of our website at{" "}
                    <a
                      href="https://kalori-api.my"
                      className="text-accent hover:underline"
                    >
                      kalori-api.my
                    </a>{" "}
                    and our Application Programming Interface (API) services.
                  </p>
                  <p>
                    By accessing or using our Service, you agree to be bound by
                    these Terms. If you do not agree to these Terms, please do
                    not use our Service.
                  </p>
                </div>
              </section>

              {/* Definitions */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  2. Definitions
                </h2>
                <ul className="space-y-3 text-content-secondary leading-relaxed list-none">
                  <li>
                    <strong className="text-content-primary">
                      &quot;API&quot;
                    </strong>{" "}
                    means the Kalori Application Programming Interface that
                    provides access to Malaysian food nutrition data.
                  </li>
                  <li>
                    <strong className="text-content-primary">
                      &quot;API Key&quot;
                    </strong>{" "}
                    means the unique identifier issued to you for authentication
                    purposes.
                  </li>
                  <li>
                    <strong className="text-content-primary">
                      &quot;User&quot;
                    </strong>{" "}
                    means any individual or entity that accesses or uses our
                    Service.
                  </li>
                  <li>
                    <strong className="text-content-primary">
                      &quot;Content&quot;
                    </strong>{" "}
                    means all data, information, text, graphics, and other
                    materials available through our Service.
                  </li>
                </ul>
              </section>

              {/* Account Registration */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  3. Account Registration
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    To access certain features of our Service, you may be
                    required to create an account. You may register using
                    third-party authentication providers including but not
                    limited to:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Google</li>
                    <li>Apple</li>
                    <li>X (formerly Twitter)</li>
                    <li>Email and password</li>
                  </ul>
                  <p>When registering, you agree to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>
                      Promptly notify us of any unauthorized access or security
                      breach
                    </li>
                    <li>
                      Accept responsibility for all activities under your
                      account
                    </li>
                  </ul>
                </div>
              </section>

              {/* API Usage */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  4. API Usage Terms
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <h3 className="text-lg font-medium text-content-primary">
                    4.1 Permitted Use
                  </h3>
                  <p>You may use our API to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>
                      Access and retrieve Malaysian food nutrition data for
                      personal or commercial applications
                    </li>
                    <li>
                      Integrate nutrition information into your health, fitness,
                      or dietary applications
                    </li>
                    <li>
                      Display and present the data in accordance with these
                      Terms
                    </li>
                  </ul>

                  <h3 className="text-lg font-medium text-content-primary mt-6">
                    4.2 Rate Limits & Quotas
                  </h3>
                  <p>
                    API access is subject to rate limits and usage quotas based
                    on your subscription tier. Exceeding these limits may result
                    in temporary or permanent restriction of access.
                  </p>

                  <h3 className="text-lg font-medium text-content-primary mt-6">
                    4.3 API Key Security
                  </h3>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Keep your API keys confidential and secure</li>
                    <li>Do not share API keys publicly or in client-side code</li>
                    <li>
                      Regenerate keys immediately if you suspect unauthorized
                      access
                    </li>
                    <li>
                      You are responsible for all API calls made with your keys
                    </li>
                  </ul>
                </div>
              </section>

              {/* Prohibited Conduct */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  5. Prohibited Conduct
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>You agree NOT to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>
                      Use the Service for any unlawful purpose or in violation
                      of any applicable laws (including Malaysian law and
                      international regulations)
                    </li>
                    <li>
                      Attempt to gain unauthorized access to our systems or
                      other users&apos; accounts
                    </li>
                    <li>
                      Interfere with or disrupt the Service or servers connected
                      to the Service
                    </li>
                    <li>
                      Reverse engineer, decompile, or attempt to extract source
                      code
                    </li>
                    <li>
                      Scrape, crawl, or use automated means to collect data
                      beyond API limits
                    </li>
                    <li>
                      Resell, redistribute, or sublicense API access without
                      authorization
                    </li>
                    <li>
                      Use the Service to transmit malware, spam, or harmful
                      content
                    </li>
                    <li>
                      Misrepresent your identity or affiliation with any person
                      or entity
                    </li>
                    <li>
                      Violate any third-party platform terms (including X/Twitter
                      Developer Agreement) when integrating with our Service
                    </li>
                  </ul>
                </div>
              </section>

              {/* Intellectual Property */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  6. Intellectual Property Rights
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    The Service, including its original content, features, and
                    functionality, is owned by Kalori API and is protected by
                    Malaysian and international copyright, trademark, and other
                    intellectual property laws.
                  </p>
                  <p>
                    You retain ownership of any applications or content you
                    create using our API. However, you grant us a non-exclusive,
                    royalty-free license to use your feedback for service
                    improvements.
                  </p>
                </div>
              </section>

              {/* Third-Party Services */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  7. Third-Party Services
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    Our Service may integrate with or contain links to
                    third-party services, including:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>
                      Authentication providers (Google, Apple, X/Twitter)
                    </li>
                    <li>Analytics services</li>
                    <li>Payment processors</li>
                  </ul>
                  <p>
                    Your use of third-party services is subject to their
                    respective terms and privacy policies. We are not
                    responsible for the content, privacy practices, or policies
                    of third-party services.
                  </p>
                </div>
              </section>

              {/* Disclaimer */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  8. Disclaimer of Warranties
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p className="uppercase font-medium">
                    THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
                    AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER
                    EXPRESS OR IMPLIED.
                  </p>
                  <p>
                    While we strive for accuracy, we do not warrant that the
                    nutrition data is error-free, complete, or suitable for
                    medical or clinical purposes. The data is provided for
                    informational purposes only and should not replace
                    professional dietary or medical advice.
                  </p>
                  <p>
                    We do not guarantee uninterrupted access to the Service and
                    may perform maintenance or updates at any time.
                  </p>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  9. Limitation of Liability
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    To the maximum extent permitted by Malaysian law, Kalori API
                    shall not be liable for any indirect, incidental, special,
                    consequential, or punitive damages, including but not
                    limited to:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Loss of profits, revenue, or data</li>
                    <li>Business interruption</li>
                    <li>Cost of substitute services</li>
                    <li>Any damages arising from your use of the Service</li>
                  </ul>
                  <p>
                    Our total liability shall not exceed the amount you paid for
                    the Service in the twelve (12) months preceding the claim.
                  </p>
                </div>
              </section>

              {/* Indemnification */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  10. Indemnification
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    You agree to indemnify, defend, and hold harmless Kalori
                    API, its officers, directors, employees, and agents from any
                    claims, damages, losses, liabilities, costs, or expenses
                    (including legal fees) arising from:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Your use of the Service</li>
                    <li>Your violation of these Terms</li>
                    <li>Your violation of any third-party rights</li>
                    <li>Any applications or content you create using our API</li>
                  </ul>
                </div>
              </section>

              {/* Termination */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  11. Termination
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    We may suspend or terminate your access to the Service at
                    any time, with or without cause, and with or without notice.
                    Grounds for termination include but are not limited to:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Violation of these Terms</li>
                    <li>Excessive API usage beyond permitted limits</li>
                    <li>Suspected fraudulent or malicious activity</li>
                    <li>At your request</li>
                  </ul>
                  <p>
                    Upon termination, your right to use the Service will
                    immediately cease, and your API keys will be invalidated.
                  </p>
                </div>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  12. Governing Law & Jurisdiction
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    These Terms shall be governed by and construed in accordance
                    with the laws of Malaysia, without regard to its conflict of
                    law provisions.
                  </p>
                  <p>
                    Any disputes arising from these Terms or the Service shall
                    be subject to the exclusive jurisdiction of the courts of
                    Malaysia.
                  </p>
                  <p>
                    For users outside Malaysia, you agree that any disputes will
                    still be resolved under Malaysian law, and you consent to
                    the jurisdiction of Malaysian courts.
                  </p>
                </div>
              </section>

              {/* Changes to Terms */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  13. Changes to Terms
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    We reserve the right to modify these Terms at any time.
                    Changes will be effective immediately upon posting on this
                    page with an updated &quot;Last Updated&quot; date.
                  </p>
                  <p>
                    We will make reasonable efforts to notify users of material
                    changes via email or prominent notice on our website. Your
                    continued use of the Service after changes constitutes
                    acceptance of the modified Terms.
                  </p>
                </div>
              </section>

              {/* Severability */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  14. Severability
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    If any provision of these Terms is found to be invalid,
                    illegal, or unenforceable, the remaining provisions shall
                    continue in full force and effect.
                  </p>
                </div>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  15. Contact Information
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    If you have any questions about these Terms, please contact
                    us at:
                  </p>
                  <div className="bg-dark-surface border border-dark-border rounded-lg p-6 mt-4">
                    <p className="font-semibold text-content-primary">
                      Kalori API
                    </p>
                    <p>Email: support@kalori-api.my</p>
                    <p>Website: https://kalori-api.my</p>
                  </div>
                </div>
              </section>

              {/* Agreement */}
              <section className="border-t border-dark-border pt-10">
                <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
                  <p className="text-content-primary font-medium">
                    By using Kalori API, you acknowledge that you have read,
                    understood, and agree to be bound by these Terms of Service.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-dark-border relative z-10">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-2.5 h-2.5 rounded-full bg-accent group-hover:scale-110 transition-transform" />
              <span className="text-lg font-semibold text-content-primary">
                Kal
              </span>
            </Link>
            <div className="flex gap-6 text-sm text-content-muted">
              <Link href="/privacy" className="hover:text-accent transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-accent">
                Terms of Service
              </Link>
            </div>
            <p className="text-content-muted text-sm">
              © {new Date().getFullYear()} Kal. All rights reserved.
            </p>
          </div>
        </Container>
      </footer>
    </main>
  );
}
