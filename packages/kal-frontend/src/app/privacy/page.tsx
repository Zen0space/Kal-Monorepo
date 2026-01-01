import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Kalori API - How we collect, use, and protect your personal data",
};

export default function PrivacyPolicyPage() {
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
                Privacy Policy
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

            {/* Compliance Notice */}
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-6 mb-10">
              <p className="text-content-primary">
                <strong>Compliance:</strong> This Privacy Policy is designed to
                comply with the{" "}
                <strong>
                  Malaysian Personal Data Protection Act 2010 (PDPA)
                </strong>
                , the{" "}
                <strong>
                  European Union General Data Protection Regulation (GDPR)
                </strong>
                , and applicable international data protection standards.
              </p>
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
                    Kalori API (&quot;we&quot;, &quot;us&quot;, or
                    &quot;our&quot;) is committed to protecting your privacy and
                    personal data. This Privacy Policy explains how we collect,
                    use, disclose, and safeguard your information when you use
                    our website at{" "}
                    <a
                      href="https://kalori-api.my"
                      className="text-accent hover:underline"
                    >
                      kalori-api.my
                    </a>{" "}
                    and our API services (collectively, the
                    &quot;Service&quot;).
                  </p>
                  <p>
                    By using our Service, you consent to the collection and use
                    of your information in accordance with this Privacy Policy.
                  </p>
                </div>
              </section>

              {/* Data Controller */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  2. Data Controller
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    For the purposes of the PDPA and GDPR, Kalori API is the
                    data controller responsible for your personal data.
                  </p>
                  <div className="bg-dark-surface border border-dark-border rounded-lg p-6 mt-4">
                    <p className="font-semibold text-content-primary">
                      Data Controller
                    </p>
                    <p>Kalori API</p>
                    <p>Email: privacy@kalori-api.my</p>
                    <p>Website: https://kalori-api.my</p>
                  </div>
                </div>
              </section>

              {/* Information We Collect */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  3. Information We Collect
                </h2>
                <div className="space-y-6 text-content-secondary leading-relaxed">
                  <div>
                    <h3 className="text-lg font-medium text-content-primary mb-3">
                      3.1 Information You Provide
                    </h3>
                    <p>
                      When you register for an account or use our Service, we
                      may collect:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                      <li>
                        <strong>Account Information:</strong> Name, email
                        address, username, profile picture
                      </li>
                      <li>
                        <strong>Authentication Data:</strong> Information from
                        third-party login providers (Google, Apple, X/Twitter)
                      </li>
                      <li>
                        <strong>Communication Data:</strong> Support inquiries,
                        feedback, and correspondence with us
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-content-primary mb-3">
                      3.2 Information Collected Automatically
                    </h3>
                    <p>When you access our Service, we automatically collect:</p>
                    <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                      <li>
                        <strong>Usage Data:</strong> API call logs, endpoints
                        accessed, request timestamps, response times
                      </li>
                      <li>
                        <strong>Device Information:</strong> IP address, browser
                        type, operating system, device identifiers
                      </li>
                      <li>
                        <strong>Log Data:</strong> Server logs, error reports,
                        access patterns
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-content-primary mb-3">
                      3.3 Information from Third Parties
                    </h3>
                    <p>
                      When you authenticate using third-party services, we may
                      receive:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                      <li>
                        <strong>Google:</strong> Name, email, profile picture
                      </li>
                      <li>
                        <strong>Apple:</strong> Name, email (may be private
                        relay)
                      </li>
                      <li>
                        <strong>X (Twitter):</strong> Username, display name,
                        profile picture, email (if authorized)
                      </li>
                    </ul>
                    <p className="mt-3 text-sm text-content-muted">
                      We only request the minimum information necessary to
                      provide our Service.
                    </p>
                  </div>
                </div>
              </section>

              {/* How We Use Information */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  4. How We Use Your Information
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>We use your personal data for the following purposes:</p>

                  <div className="overflow-x-auto mt-4">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-dark-surface">
                          <th className="border border-dark-border p-3 text-left text-content-primary">
                            Purpose
                          </th>
                          <th className="border border-dark-border p-3 text-left text-content-primary">
                            Legal Basis (GDPR)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-dark-border p-3">
                            Account creation and management
                          </td>
                          <td className="border border-dark-border p-3">
                            Contract performance
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-dark-border p-3">
                            API access and authentication
                          </td>
                          <td className="border border-dark-border p-3">
                            Contract performance
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-dark-border p-3">
                            Usage monitoring and rate limiting
                          </td>
                          <td className="border border-dark-border p-3">
                            Legitimate interest
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-dark-border p-3">
                            Service improvements and analytics
                          </td>
                          <td className="border border-dark-border p-3">
                            Legitimate interest
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-dark-border p-3">
                            Security and fraud prevention
                          </td>
                          <td className="border border-dark-border p-3">
                            Legitimate interest / Legal obligation
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-dark-border p-3">
                            Customer support
                          </td>
                          <td className="border border-dark-border p-3">
                            Contract performance
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-dark-border p-3">
                            Legal compliance
                          </td>
                          <td className="border border-dark-border p-3">
                            Legal obligation
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Data Sharing */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  5. Data Sharing and Disclosure
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    We do not sell your personal data. We may share your
                    information only in the following circumstances:
                  </p>

                  <ul className="list-disc list-inside ml-4 space-y-3">
                    <li>
                      <strong>Service Providers:</strong> Trusted third parties
                      who assist in operating our Service (hosting, analytics,
                      payment processing)
                    </li>
                    <li>
                      <strong>Legal Requirements:</strong> When required by law,
                      court order, or government authority (including Malaysian
                      regulatory bodies)
                    </li>
                    <li>
                      <strong>Safety and Security:</strong> To protect our
                      rights, property, or safety, or that of our users or the
                      public
                    </li>
                    <li>
                      <strong>Business Transfers:</strong> In connection with a
                      merger, acquisition, or sale of assets (with prior notice
                      to users)
                    </li>
                    <li>
                      <strong>With Your Consent:</strong> Where you have
                      explicitly agreed to the disclosure
                    </li>
                  </ul>
                </div>
              </section>

              {/* International Transfers */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  6. International Data Transfers
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    Your data may be transferred to and processed in countries
                    outside Malaysia, including countries in the European
                    Economic Area (EEA) and other regions.
                  </p>
                  <p>When transferring data internationally, we ensure:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>
                      Adequate safeguards are in place (e.g., Standard
                      Contractual Clauses for EU transfers)
                    </li>
                    <li>Compliance with PDPA cross-border transfer requirements</li>
                    <li>
                      Data protection standards equivalent to those in Malaysia
                    </li>
                  </ul>
                </div>
              </section>

              {/* Data Retention */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  7. Data Retention
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    We retain your personal data only for as long as necessary
                    to fulfill the purposes for which it was collected:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>
                      <strong>Account Data:</strong> Retained while your account
                      is active and for 30 days after deletion request
                    </li>
                    <li>
                      <strong>API Usage Logs:</strong> Retained for 90 days for
                      security and analytics purposes
                    </li>
                    <li>
                      <strong>Financial Records:</strong> Retained for 7 years
                      as required by Malaysian tax law
                    </li>
                    <li>
                      <strong>Legal Hold Data:</strong> Retained as required by
                      ongoing legal proceedings
                    </li>
                  </ul>
                </div>
              </section>

              {/* Your Rights */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  8. Your Rights
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    Under the PDPA and GDPR, you have the following rights
                    regarding your personal data:
                  </p>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
                      <h4 className="font-semibold text-content-primary mb-2">
                        🔍 Right of Access
                      </h4>
                      <p className="text-sm">
                        Request a copy of your personal data we hold
                      </p>
                    </div>
                    <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
                      <h4 className="font-semibold text-content-primary mb-2">
                        ✏️ Right to Rectification
                      </h4>
                      <p className="text-sm">
                        Request correction of inaccurate data
                      </p>
                    </div>
                    <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
                      <h4 className="font-semibold text-content-primary mb-2">
                        🗑️ Right to Erasure
                      </h4>
                      <p className="text-sm">
                        Request deletion of your personal data
                      </p>
                    </div>
                    <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
                      <h4 className="font-semibold text-content-primary mb-2">
                        ⏸️ Right to Restriction
                      </h4>
                      <p className="text-sm">
                        Request limitation of data processing
                      </p>
                    </div>
                    <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
                      <h4 className="font-semibold text-content-primary mb-2">
                        📦 Right to Portability
                      </h4>
                      <p className="text-sm">
                        Receive your data in a machine-readable format
                      </p>
                    </div>
                    <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
                      <h4 className="font-semibold text-content-primary mb-2">
                        🚫 Right to Object
                      </h4>
                      <p className="text-sm">
                        Object to processing based on legitimate interest
                      </p>
                    </div>
                  </div>

                  <p className="mt-4">
                    To exercise these rights, contact us at{" "}
                    <a
                      href="mailto:privacy@kalori-api.my"
                      className="text-accent hover:underline"
                    >
                      privacy@kalori-api.my
                    </a>
                    . We will respond within 21 days (PDPA) or 30 days (GDPR).
                  </p>
                </div>
              </section>

              {/* Security */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  9. Data Security
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    We implement appropriate technical and organizational
                    measures to protect your personal data, including:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Encryption of data in transit (TLS/SSL)</li>
                    <li>Encryption of data at rest</li>
                    <li>Secure authentication mechanisms</li>
                    <li>Regular security audits and assessments</li>
                    <li>Access controls and principle of least privilege</li>
                    <li>Employee training on data protection</li>
                  </ul>
                  <p className="mt-4 text-sm text-content-muted">
                    While we strive to protect your data, no method of
                    transmission or storage is 100% secure. We encourage you to
                    use strong passwords and keep your credentials confidential.
                  </p>
                </div>
              </section>

              {/* Cookies */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  10. Cookies and Tracking Technologies
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>We use cookies and similar technologies to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Maintain your login session</li>
                    <li>Remember your preferences</li>
                    <li>Analyze website usage and improve our Service</li>
                    <li>Ensure security and prevent fraud</li>
                  </ul>

                  <div className="mt-4">
                    <h4 className="font-medium text-content-primary mb-2">
                      Types of Cookies We Use:
                    </h4>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      <li>
                        <strong>Essential Cookies:</strong> Required for the
                        Service to function
                      </li>
                      <li>
                        <strong>Analytics Cookies:</strong> Help us understand
                        how users interact with our Service
                      </li>
                    </ul>
                  </div>

                  <p className="mt-4">
                    You can manage cookie preferences through your browser
                    settings. Note that disabling essential cookies may affect
                    Service functionality.
                  </p>
                </div>
              </section>

              {/* Third-Party Services */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  11. Third-Party Services
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>Our Service integrates with the following third parties:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>
                      <strong>Logto:</strong> Authentication service
                    </li>
                    <li>
                      <strong>Google (OAuth):</strong> Social login provider
                    </li>
                    <li>
                      <strong>Apple (Sign in with Apple):</strong> Social login
                      provider
                    </li>
                    <li>
                      <strong>X/Twitter (OAuth):</strong> Social login provider
                    </li>
                  </ul>
                  <p className="mt-4">
                    These services have their own privacy policies. We encourage
                    you to review their policies to understand how they handle
                    your data.
                  </p>
                </div>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  12. Children&apos;s Privacy
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    Our Service is not intended for individuals under the age of
                    13 (or 16 in the EU). We do not knowingly collect personal
                    data from children.
                  </p>
                  <p>
                    If you believe we have collected data from a child, please
                    contact us immediately at{" "}
                    <a
                      href="mailto:privacy@kalori-api.my"
                      className="text-accent hover:underline"
                    >
                      privacy@kalori-api.my
                    </a>
                    , and we will take steps to delete such information.
                  </p>
                </div>
              </section>

              {/* Changes to Policy */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  13. Changes to This Privacy Policy
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    We may update this Privacy Policy from time to time. Changes
                    will be posted on this page with an updated &quot;Last
                    Updated&quot; date.
                  </p>
                  <p>
                    For significant changes, we will provide notice via email or
                    prominent announcement on our website. Your continued use of
                    the Service after changes constitutes acceptance of the
                    updated policy.
                  </p>
                </div>
              </section>

              {/* PDPA Notice */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  14. PDPA Notice (Malaysia)
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    In accordance with the Personal Data Protection Act 2010
                    (PDPA) of Malaysia:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>
                      Your personal data is processed for the purposes stated in
                      this Privacy Policy
                    </li>
                    <li>
                      You have the right to access and correct your personal
                      data
                    </li>
                    <li>
                      You may limit the processing of your personal data by
                      contacting us
                    </li>
                    <li>
                      We will obtain your consent before processing sensitive
                      personal data
                    </li>
                    <li>
                      You may lodge a complaint with the Personal Data
                      Protection Commissioner if you believe we have violated
                      the PDPA
                    </li>
                  </ul>
                </div>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-semibold text-content-primary mb-4">
                  15. Contact Us
                </h2>
                <div className="space-y-4 text-content-secondary leading-relaxed">
                  <p>
                    If you have any questions about this Privacy Policy or wish
                    to exercise your rights, please contact us:
                  </p>
                  <div className="bg-dark-surface border border-dark-border rounded-lg p-6 mt-4">
                    <p className="font-semibold text-content-primary">
                      Kalori API - Privacy Team
                    </p>
                    <p>Email: privacy@kalori-api.my</p>
                    <p>General Inquiries: support@kalori-api.my</p>
                    <p>Website: https://kalori-api.my</p>
                  </div>
                </div>
              </section>

              {/* Acknowledgment */}
              <section className="border-t border-dark-border pt-10">
                <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
                  <p className="text-content-primary font-medium">
                    By using Kalori API, you acknowledge that you have read and
                    understood this Privacy Policy and consent to the
                    collection, use, and disclosure of your personal data as
                    described herein.
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
              <Link href="/privacy" className="text-accent">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-accent transition-colors">
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
