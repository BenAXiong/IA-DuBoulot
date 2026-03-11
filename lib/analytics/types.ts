export const ANALYTICS_EVENT_NAMES = [
  "page_view",
  "cta_click",
  "student_new_homework_start",
  "student_session_complete",
  "billing_checkout_start",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export type AnalyticsEventProperties = Record<
  string,
  string | number | boolean | null
>;

export type AnalyticsEventInput = {
  name: AnalyticsEventName;
  route: string;
  properties?: AnalyticsEventProperties;
};

export function isAnalyticsEventName(
  value: string,
): value is AnalyticsEventName {
  return ANALYTICS_EVENT_NAMES.includes(value as AnalyticsEventName);
}
