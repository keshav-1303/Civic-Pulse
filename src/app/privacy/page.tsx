import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How CivicPulse collects, uses and protects the information you share when reporting civic issues.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-ink-400">Last updated: June 2026</p>

      <div className="card mt-6 space-y-6 p-6 text-sm leading-relaxed text-ink-600">
        <section>
          <h2 className="text-base font-semibold text-ink-800">Overview</h2>
          <p className="mt-1">
            CivicPulse is a demonstration civic-reporting platform. This policy explains what
            information we handle and why. We collect only what is needed to process and resolve the
            civic issues you report.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink-800">Information we process</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Issue details you submit: description, photos and the location of the problem.</li>
            <li>Approximate device or network information used for rate limiting and abuse prevention.</li>
            <li>Optional analytics on aggregate usage, only when explicitly enabled by the operator.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink-800">How we use it</h2>
          <p className="mt-1">
            Reported information is used to categorize, prioritize, route and verify civic issues, and
            to display them on public maps and dashboards. Photos may be analyzed by AI models to
            assess severity and confirm resolution.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink-800">AI processing</h2>
          <p className="mt-1">
            Text and images you submit may be sent to Google Gemini models for analysis. Do not include
            sensitive personal information in reports. Avoid capturing identifiable bystanders in photos.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink-800">Data retention</h2>
          <p className="mt-1">
            In this demonstration build, issue data is stored in memory and is not permanently retained
            across server restarts. A production deployment would define a clear retention schedule.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink-800">Contact</h2>
          <p className="mt-1">
            Questions about this policy can be directed to the platform operator listed in your
            deployment.
          </p>
        </section>
      </div>
    </div>
  );
}
