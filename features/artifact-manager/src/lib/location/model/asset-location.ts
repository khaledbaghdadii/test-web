import { Storage } from "../../storage/model/storage";
import { AssetLocationType } from "./asset-location-type";

export interface AssetLocation {
  storage: Storage;
  relativePath: string;
  fullPath: string;
  type: AssetLocationType;
}
