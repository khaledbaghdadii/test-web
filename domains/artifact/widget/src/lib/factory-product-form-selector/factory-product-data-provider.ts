import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import {
  DropdownOption,
  MxEvolveSingleSelectDataProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  FactoryProduct,
  FactoryProductApiService,
} from "@mxevolve/domains/artifact/data-access";

/**
 * Submitted factory-product value (legacy `FactoryProductInput`) derived from a
 * selected `FactoryProduct`. Structurally matches the Upgrade executor's
 * `UpgradeFactoryProductValue`.
 */
export interface FactoryProductValue {
  id: string;
  mxVersion: string;
  mxBuildId: string;
  bipVersion?: string;
  bipBuildId?: string;
}

export interface FactoryProductSelectorParams {
  projectId: string;
}

/**
 * Maps a fetched `FactoryProduct` to the submitted `FactoryProductValue`,
 * reproducing the legacy `factory-product-input` field mapping: the MX version /
 * build id from the software product and the BIP version / build id from the
 * first configuration component (each build id taken from the build carrying MX
 * bundles).
 */
export function mapFactoryProductToValue(
  product: FactoryProduct
): FactoryProductValue {
  const mxBuildId = product.softwareProduct.builds.find(
    (build) => build.mxBundles?.length
  )?.mxBuild.buildId;
  const bipComponent = product.configurationComponents?.[0];
  const bipBuildId = bipComponent?.builds.find(
    (build) => build.mxBundles?.length
  )?.mxBuild.buildId;

  return {
    id: product.id,
    mxVersion: product.softwareProduct.version,
    mxBuildId: mxBuildId ?? "",
    bipVersion: bipComponent?.version,
    bipBuildId,
  };
}

/**
 * Feeds the factory-product single-select dropdown with the project's factory
 * products. The option label is the software product version + MX build id and
 * the value is the factory product itself (mapped to the submitted value on
 * selection; the id is read back via getItemId).
 */
export class FactoryProductDataProvider
  implements
    MxEvolveSingleSelectDataProvider<
      FactoryProduct,
      FactoryProductSelectorParams
    >
{
  constructor(
    private readonly factoryProductService: FactoryProductApiService
  ) {}

  fetchData(
    params: FactoryProductSelectorParams
  ): Observable<FactoryProduct[]> {
    return this.factoryProductService
      .getFactoryProducts(params.projectId, {})
      .pipe(map((page) => page.content));
  }

  toDropdownOption(item: FactoryProduct): DropdownOption<FactoryProduct> {
    const value = mapFactoryProductToValue(item);
    const label = value.mxBuildId
      ? `${value.mxVersion} (${value.mxBuildId})`
      : value.mxVersion;
    return { label, value: item };
  }

  getItemId(item: FactoryProduct): string {
    return item.id;
  }
}
