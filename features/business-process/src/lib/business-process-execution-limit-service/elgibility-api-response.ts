export interface ElgibilityApiResponse {
  eligible: boolean;
  ineligibilityResult?: IneligibilityApiResult;
}

export interface IneligibilityApiResult {
  reason: string;
  ineligibilityData: {
    [key: string]: unknown;
  };
}
