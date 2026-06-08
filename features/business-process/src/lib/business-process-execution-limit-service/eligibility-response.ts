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
