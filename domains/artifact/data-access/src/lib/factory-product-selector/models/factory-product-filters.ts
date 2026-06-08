export interface FactoryProductFilters {
  readonly softwareProductVersionFilter?: string;
  readonly softwareProductBuildFilter?: string;
  readonly configurationComponentVersionSearch?: string;
  readonly fetchGlobal?: boolean;
  readonly pageIndex?: number;
  readonly pageSize?: number;
}
