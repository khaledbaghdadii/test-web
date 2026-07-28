import { MenuItem } from "primeng/api";
import {
  ARTIFACT_MANAGEMENT_MFE_PATH,
  ENVIRONMENT_MFE_PATH,
  INFRA_MFE_PATH,
  SCM_MFE_PATH,
} from "@mxflow/config";
import { link } from "../project-nav-link.util";

/** Navigation items for the Project Assets section. */
export function assetsNavItems(projectId: string): MenuItem[] {
  return [
    {
      label: "Merge Request",
      routerLink: link(projectId, `${SCM_MFE_PATH}/merge-request-reporting`),
      title: "Merge Request Reporting",
      state: {
        authorizationInput: {
          action: "read",
          projectId,
          attributes: {},
          package: "web",
          resource: "merge_request_reporting_sidebar_item",
        },
      },
    },
    {
      label: "Final Products",
      routerLink: link(projectId, ARTIFACT_MANAGEMENT_MFE_PATH),
      state: {
        authorizationInput: {
          action: "read",
          attributes: { projectId },
          package: "web",
          resource: "artifact_management_sidebar_item",
        },
      },
    },
    {
      label: "Env Deployments",
      routerLink: link(projectId, `${ENVIRONMENT_MFE_PATH}/all-deployments`),
      state: {
        authorizationInput: [
          {
            package: "web",
            resource: "environment_sidebar_item",
            action: "read",
            attributes: { projectId },
          },
          {
            package: "web",
            resource: "environments_list_page",
            action: "read",
            attributes: { projectId },
          },
        ],
      },
    },
    {
      label: "Infra Allocation",
      routerLink: link(projectId, `${INFRA_MFE_PATH}/allocations`),
      state: {
        authorizationInput: {
          action: "read",
          attributes: { projectId },
          package: "infra",
          resource: "allocation",
        },
      },
    },
  ];
}
