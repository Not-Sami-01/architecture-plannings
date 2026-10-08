/**
 * Facts only the studio owner can confirm (CONTENT pack: "[SQUARE BRACKETS]").
 *
 * Rules:
 * - `null` means "not confirmed yet" — pages must NOT render the sentence that
 *   depends on it (invented claims hurt trust and SEO).
 * - Prices and revision limits are NOT here: they come from the seeded packages
 *   in the database. Advance share comes from `ORDER_DEFAULTS.advancePercent`.
 * - Fill every `TODO(owner)` before publishing.
 */

export type SiteFacts = {
  /** TODO(owner): city the studio is based in, e.g. "Lahore". Used by LocalBusiness schema. */
  city: string | null;
  /** TODO(owner): countries/regions served, e.g. "Pakistan and overseas clients". */
  serviceAreas: string | null;
  /** TODO(owner): typical days from verified advance to first draft, e.g. "7–10". */
  firstDraftDays: string | null;
  /** TODO(owner): typical reply time, e.g. "a few hours". */
  responseTime: string | null;
  /** TODO(owner): working days and hours with timezone, e.g. "Saturday–Thursday, 10:00–19:00 PKT". */
  workingHours: string | null;
  /** TODO(owner): payment methods, e.g. "bank transfer and wallet". */
  paymentMethods: string | null;
  /** TODO(owner): formats the client receives for finals, e.g. "PDF and editable .ai files". */
  finalFileFormats: string | null;
  /** TODO(owner): years of experience, e.g. "8". */
  yearsExperience: string | null;
  /** TODO(owner): qualification, e.g. "degree/diploma in architectural design". */
  qualification: string | null;
  /** TODO(owner): honest answer about licensed-architect registration and stamping needs. */
  registrationAnswer: string | null;
  /** TODO(owner): honest answer on whether portfolio projects are real client work. */
  portfolioSource: string | null;
  /** TODO(owner): whether a free consultation is offered. */
  freeConsultation: string | null;
  /** TODO(owner): whether in-person meetings are offered. */
  inPersonMeetings: string | null;
  /** TODO(owner): languages supported. */
  languages: string | null;
  /** TODO(owner): "2D drawing" or "3D-style view" — what the elevation deliverable actually is. */
  elevationDeliverable: string | null;
  /** TODO(owner): whether editable source files are included in the Full Package. */
  editableFilesAnswer: string | null;
  /** TODO(owner): 2–4 sentences, your own words — the main trust signal on /about. */
  story: readonly string[];
  /** TODO(owner): contact email shown on /contact (also used for LocalBusiness schema). */
  supportEmail: string | null;
};

export const SITE_FACTS: SiteFacts = {
  city: null,
  serviceAreas: null,
  firstDraftDays: null,
  responseTime: null,
  workingHours: null,
  paymentMethods: null,
  finalFileFormats: null,
  yearsExperience: null,
  qualification: null,
  registrationAnswer: null,
  portfolioSource: null,
  freeConsultation: null,
  inPersonMeetings: null,
  languages: null,
  elevationDeliverable: null,
  editableFilesAnswer: null,
  story: [],
  supportEmail: null,
};

/** "7–10" → "7–10 days", or null when unconfirmed. */
export function firstDraftSentence(facts: SiteFacts = SITE_FACTS): string | null {
  return facts.firstDraftDays ? `A first draft is typically ready ${facts.firstDraftDays} days after the advance payment is verified.` : null;
}
