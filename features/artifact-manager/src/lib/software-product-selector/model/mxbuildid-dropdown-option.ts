export interface MxBuildIdDropdownOption {
  label: string;
  value: MxBuildIdDropdownValue;
}

export interface MxBuildIdDropdownValue {
  buildId: string;
  parentId: string | undefined;
}
