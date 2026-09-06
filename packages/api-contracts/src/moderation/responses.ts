export type RuleSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";
export type PostFilterStatus = "all" | "visible" | "hidden" | "flagged";
export type ModerationDecision = "HIDE" | "RESTORE" | "RESOLVE" | "DISMISS";

export interface ModerationToggleResponse {
  userId: string;
  blocked?: boolean;
  muted?: boolean;
}

export interface ReportPostResponse {
  reported: true;
  report: unknown;
}
