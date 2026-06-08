export interface FactoryProductFilters {
  parentFactoryProductIdFilter?: string;
  factoryProductIdSearch?: string;
  softwareProductVersionFilter?: string;
  softwareProductBuildFilter?: string;
  softwareProductVersionSearch?: string;
  softwareProductBuildSearch?: string;
  configurationComponentVersionSearch?: string;
  configurationComponentVersionFilter?: string;
  factoryProductTypeFilter?: string;
  factoryProductTypeSearch?: string;
  factoryProductValidationLevelSearch?: string;
  softwareProductRevisionFilter?: string;
  softwareProductRevisionSearch?: string;
  softwareProductOsFilter?: string;
  softwareProductOsSearch?: string;
  searchKey?: string;
  pageIndex?: number;
  pageSize?: number;
  projectIds?: string[];
  fetchGlobal?: boolean;
}
