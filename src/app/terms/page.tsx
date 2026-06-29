import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of the CivicPulse civic-reporting platform.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-ink-400">Last updated: June 2026</p>

      <div className="card mt-6 space-y-6 p-6 text-sm leading-relaxed text-ink-600">
        <section>
          <h2 className="text-base font-semibold text-ink-800">Acceptance</h2>
          <p className="mt-1">
            By using CivicPulse you agree to these terms. If you do not agree, please do not use the
            platform.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink-800">Acceptable use</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Submit accurate, good-faith reports of genuine civic issues.</li>
            <li>Do not submit spam, false reports, harassment or unlawful content.</li>
            <li>Do not attempt to disrupt, overload or reverse-engineer the service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink-800">Content you submit</h2>
          <p className="mt-1">
            You are responsible for the content you submit and confirm you have the right to share it.
            By submitting a report you grant the platform a license to display and process it for the
            purpose of resolving civic issues.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink-800">No warranty</h2>
          <p className="mt-1">
            This platform is provided on an as-is basis without warranties of any kind. AI-generated
            assessments are advisory and may contain errors. Resolution of reported issues depends on
            third parties and is not guaranteed.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink-800">Limitation of liability</h2>
          <p className="mt-1">
            To the maximum extent permitted by law, the operators of CivicPulse are not liable for any
            indirect or consequential damages arising from your use of the service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink-800">Changes</h2>
          <p className="mt-1">
            These terms may be updated from time to time. Continued use after changes constitutes
            acceptance of the revised terms.
          </p>
        </section>
      </div>
    </div>
  );
}
