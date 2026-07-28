import { MenuItem } from "primeng/api";
import {
  ENVIRONMENT_MFE_PATH,
  INFRA_MFE_PATH,
  TEST_MFE_PATH,
} from "@mxflow/config";
import { link } from "../project-nav-link.util";

/** Feature flag gating the "Pools" item under Setup > Environments. */
export const POOLS_FEATURE_FLAG_NAME = "pools";

/** Navigation items for the Project Setup section. */
export function setupNavItems(
  projectId: string,
  poolsEnabled: boolean
): MenuItem[] {
  const environmentsChildren: MenuItem[] = [
    {
      label: "Definitions",
      routerLink: link(projectId, `${ENVIRONMENT_MFE_PATH}/definitions`),
      state: {
        authorizationInput: {
          package: "web",
          resource: "environment_definitions_page",
          action: "read",
          attributes: { projectId },
        },
      },
    },
    {
      label: "Runtime Properties",
      routerLink: link(projectId, `${ENVIRONMENT_MFE_PATH}/runtime-properties`),
      state: {
        authorizationInput: {
          package: "web",
          resource: "runtime_properties_documentation_page",
          action: "read",
          attributes: { projectId },
        },
      },
    },
  ];
  if (poolsEnabled) {
    environmentsChildren.push({
      label: "Pools",
      routerLink: link(projectId, `${ENVIRONMENT_MFE_PATH}/pools`),
      state: {
        authorizationInput: {
          package: "web",
          resource: "environment_pools_page",
          action: "read",
          attributes: { projectId },
        },
      },
    });
  }

  return [
    {
      label: "Process Templates",
      routerLink: link(projectId, "business-process/definition"),
    },
    {
      label: "Environments",
      state: {
        authorizationInput: {
          package: "web",
          resource: "environment_sidebar_item",
          action: "read",
          attributes: { projectId },
        },
      },
      items: environmentsChildren,
    },
    {
      label: "Scenarios",
      items: [
        {
          label: "Test Scenario Definitions",
          routerLink: link(projectId, `${TEST_MFE_PATH}/scenario`),
          state: {
            authorizationInput: {
              action: "read",
              attributes: { projectId },
              package: "test",
              resource: "scenario_definition",
            },
          },
        },
        {
          label: "Test Package Definitions",
          routerLink: link(projectId, `${TEST_MFE_PATH}/definition`),
          state: {
            authorizationInput: {
              action: "read",
              attributes: { projectId },
              package: "test",
              resource: "test_definition",
            },
          },
        },
      ],
    },
    {
      label: "Infra",
      state: {
        authorizationInput: {
          action: "read",
          attributes: { projectId },
          package: "web",
          resource: "infra_sidebar_item",
        },
      },
      items: [
        {
          label: "Groups",
          routerLink: link(projectId, `${INFRA_MFE_PATH}/groups`),
          state: {
            authorizationInput: {
              action: "read",
              attributes: { projectId },
              package: "web",
              resource: "group_sidebar_item",
            },
          },
        },
        {
          label: "Machines",
          routerLink: link(projectId, `${INFRA_MFE_PATH}/machines`),
          state: {
            authorizationInput: {
              action: "read",
              attributes: { projectId },
              package: "web",
              resource: "infra_machines",
            },
          },
        },
      ],
    },
  ];
}
