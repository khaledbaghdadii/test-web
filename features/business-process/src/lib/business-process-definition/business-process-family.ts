import { InputField } from "@mxflow/ui/inputs";

export interface BusinessProcessFamily {
  id: string;
  name: string;
  inputs: InputField[];
  process: {
    stages: BusinessProcessStage[];
  };
}

export interface BusinessProcessStage {
  name: string;
}

export enum BusinessProcessFamilies {
  VALIDATION_PROCESS = "master-validation",
  UPGRADE_PROCESS = "binary-upgrade",
  USER_STORY_BUILD_AND_TEST = "user-story-build-and-test",
}
