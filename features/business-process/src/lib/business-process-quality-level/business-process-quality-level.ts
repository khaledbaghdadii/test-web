interface BusinessProcessQualityLevelFilter {
  text: string;
  value: string;
}

export const businessProcessQualityLevelFilters: BusinessProcessQualityLevelFilter[] =
  [
    { text: "DQG", value: "DQG" },
    { text: "MQG", value: "MQG" },
    { text: "N/A", value: "NA" },
  ];
