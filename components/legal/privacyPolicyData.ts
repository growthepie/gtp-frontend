export const privacyPolicyLastUpdated = "May 21, 2026";
export const privacyPolicyLastUpdatedIso = "2026-05-21";

export type PrivacyPolicySection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const privacyPolicySections: PrivacyPolicySection[] = [
  {
    title: "Controller",
    paragraphs: [
      "The controller responsible for this website is orbal GmbH, c/o w3.hub, Moeckernstr. 120, 10963 Berlin, Germany. orbal GmbH is represented by Matthias Seidl.",
      "You can contact us by email at matthias@orbal-analytics.com. We have not appointed a data protection officer because we are not currently required to do so under applicable law.",
    ],
  },
  {
    title: "What We Process",
    paragraphs: [
      "growthepie is an analytics website for public blockchain and ecosystem data. You can use the website without creating an account. Depending on how you use the site, we may process the following categories of data.",
    ],
    bullets: [
      "Technical access data: IP address, request URL, date and time, browser and device information, referrer, server logs, and security-related request metadata.",
      "Analytics data: page views, approximate location, device type, browser, referrer, and interaction events such as clicks on charts, filters, downloads, and navigation items.",
      "Cookie and preference data: cookie consent state, theme preference, recently used searches, selected metrics, chart settings, and similar browser-side preferences.",
      "Contact and submission data: information you actively submit through forms, surveys, project edits, application contributions, donation-related forms, or similar workflows, such as project name, website, social links, wallet address, logo files, descriptions, feedback, and contact details if provided.",
      "Public contribution data: project metadata or app information submitted for inclusion in open datasets or GitHub-based contribution workflows.",
    ],
  },
  {
    title: "Why We Process Data",
    paragraphs: [
      "We process personal data only where we have a legal basis under the GDPR. The main purposes and legal bases are listed below.",
    ],
    bullets: [
      "Website delivery, security, abuse prevention, debugging, and availability: Art. 6(1)(f) GDPR, based on our legitimate interest in operating a secure and reliable website.",
      "Cookie consent and preference storage: Art. 6(1)(c) GDPR where consent records are legally required, and Art. 6(1)(f) GDPR for strictly necessary preferences.",
      "Google Analytics, Google Tag Manager, advertising-related consent signals, and comparable non-essential analytics: Art. 6(1)(a) GDPR, based on consent.",
      "Privacy-friendly aggregated analytics through Vercel Web Analytics: Art. 6(1)(f) GDPR, based on our legitimate interest in understanding aggregate site usage without cross-site tracking cookies.",
      "Responding to messages, surveys, project edits, app contributions, and similar submissions: Art. 6(1)(b) GDPR for requested pre-contractual or service-related steps, Art. 6(1)(f) GDPR for community/project operations, and Art. 6(1)(a) GDPR where a submission is optional and consent-based.",
      "Legal compliance, accounting, documentation, and defense of claims: Art. 6(1)(c) and Art. 6(1)(f) GDPR.",
    ],
  },
  {
    title: "Cookies, Consent, and Local Storage",
    paragraphs: [
      "We use a consent banner for non-essential analytics. Before consent, Google consent mode defaults analytics and advertising storage to denied. If you decline, we store that choice so we do not ask again immediately.",
      "You can delete cookies and local storage through your browser settings. Doing so may reset preferences such as theme, saved metrics, recent searches, or chart settings.",
    ],
    bullets: [
      "gtpCookieConsent: stores whether analytics cookies were accepted or declined. Retention: up to 12 months.",
      "gtpConsentVersion: stores the consent-banner version. Retention: up to 12 months.",
      "Theme, focus mode, selected metrics, recent searches, recent results, and project-edit draft helpers may be stored in localStorage. Retention: until you clear browser storage or the app removes the value.",
      "Vercel Web Analytics does not use tracking cookies. It is used for aggregated usage statistics.",
      "Google Analytics and Google Tag Manager may set or access cookies only according to your consent state and the configured Google consent mode.",
    ],
  },
  {
    title: "Analytics and Third-Party Services",
    paragraphs: [
      "We use analytics to understand aggregate usage, improve the product, and measure whether charts, pages, and tools work as intended.",
    ],
    bullets: [
      "Vercel hosts parts of the website infrastructure and provides Web Analytics. Vercel Web Analytics is designed to provide aggregated analytics without third-party cookies or cross-site user identifiers.",
      "Google Tag Manager and Google Analytics 4 may be used after consent. Google Analytics 4 does not log or store individual IP addresses from EU users according to Google's current documentation, but Google may process analytics data as an independent provider under its own terms.",
      "Airtable may be used to store survey responses, notifications, donation-related form data, and similar submitted records.",
      "GitHub and Open Labels tooling may be used for project/app contribution workflows. If you submit project metadata for public inclusion, the submitted data may become public in repositories, pull requests, datasets, or related review systems.",
      "Discord webhooks may be used internally to notify the team about certain submissions or system events.",
    ],
  },
  {
    title: "Recipients and International Transfers",
    paragraphs: [
      "We do not sell personal data. We share personal data only when needed to operate the website, process submissions, comply with legal obligations, or protect our rights.",
      "Recipients may include hosting and infrastructure providers, analytics providers, form/database providers, repository and contribution platforms, internal collaboration tools, professional advisors, and authorities where legally required.",
      "Some providers may process data outside the European Economic Area. Where required, we rely on adequacy decisions, standard contractual clauses, data processing agreements, or other safeguards provided by the relevant service provider.",
    ],
  },
  {
    title: "Retention",
    paragraphs: [
      "We keep personal data only as long as necessary for the purpose for which it was collected, unless a longer retention period is required or justified by law.",
    ],
    bullets: [
      "Consent cookies are retained for up to 12 months.",
      "Browser localStorage preferences remain until you clear browser storage or the app removes them.",
      "Operational logs are kept only as long as needed for security, debugging, and service operation, typically for a short operational period unless an incident requires longer retention.",
      "Analytics data is retained according to the settings and retention periods of the relevant analytics provider.",
      "Contact, survey, donation-related, and project-submission records are retained while needed to process the request and for reasonable documentation periods, generally no longer than three years after the last relevant interaction unless legal obligations require longer retention.",
      "Public project/app contribution data may be retained indefinitely where it becomes part of public repositories, public datasets, changelogs, or historical records.",
    ],
  },
  {
    title: "Your Rights",
    paragraphs: [
      "Subject to the conditions in the GDPR, you have the right to request access to your personal data, rectification, erasure, restriction of processing, data portability, and objection to processing based on legitimate interests. Where processing is based on consent, you may withdraw consent at any time with effect for the future.",
      "You also have the right to lodge a complaint with a competent data protection supervisory authority. In Berlin, the competent authority is the Berlin Commissioner for Data Protection and Freedom of Information.",
      "To exercise your rights, contact us at matthias@orbal-analytics.com. We may need to verify your identity before responding to a request.",
    ],
  },
  {
    title: "Automated Decision-Making",
    paragraphs: [
      "We do not use automated decision-making or profiling that produces legal effects concerning you or similarly significantly affects you.",
    ],
  },
  {
    title: "Changes",
    paragraphs: [
      "We may update this privacy policy when our website, processors, analytics setup, or legal requirements change. The date at the top shows when this policy was last updated.",
    ],
  },
];
