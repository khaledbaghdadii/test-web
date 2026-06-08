import { MxDeployPackage } from "../model/mxdeploy-package";

export interface MxDeployPackageDropdownOption {
  label: string;
  value: MxDeployPackage | undefined;
}
