import { AssetLocation } from "../../location/model/asset-location";

export interface Asset {
  id: string;
  nickname?: string;
  locations: AssetLocation[];
}
