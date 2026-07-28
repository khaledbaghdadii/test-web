/**
 * Result of a repush eligibility check for a business-process execution.
 *
 * Migrated from the legacy `eligibility-response.ts`
 * (`@mxflow/features/business-process`) — same shape, new-architecture location.
 */
export interface EligibilityResponse {
  eligible: boolean;
  ineligibilityResult?: IneligibilityResult;
}

export interface IneligibilityResult {
  reason: string;
  ineligibilityData: {
    [key: string]: unknown;
  };
}
