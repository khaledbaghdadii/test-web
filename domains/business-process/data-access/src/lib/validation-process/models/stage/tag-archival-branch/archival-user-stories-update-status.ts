export interface ArchivalUserStoryUpdate {
  userStoryId: string;
  updated: boolean;
}

export interface ArchivalUserStoriesUpdateStatus {
  startDate?: string;
  endDate?: string;
  facedTechnicalIssues: boolean;
  result: ArchivalUserStoryUpdate[];
}
