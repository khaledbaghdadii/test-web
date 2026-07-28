import { MenuItem } from "primeng/api";
import { INFRA_MFE_PATH } from "@mxflow/config";
import { link } from "../project-nav-link.util";

/** Feature flag gating the "Config Audit" item under Settings. */
export const CONFIG_AUDIT_FEATURE_FLAG_NAME = "config-audit";

/** Navigation items for the Settings section. */
export function settingsNavItems(
  projectId: string,
  configAuditEnabled: boolean
): MenuItem[] {
  const items: MenuItem[] = [
    {
      label: "Details",
      routerLink: link(projectId, "project/details"),
      routerLinkActiveOptions: { exact: true },
      state: {
        authorizationInput: {
          action: "update",
          attributes: {},
          package: "project",
          resource: "project",
        },
      },
    },
    {
      label: "MXtools",
      routerLink: link(projectId, "project/mx-tools"),
      state: {
        authorizationInput: {
          action: "read",
          attributes: {},
          package: "web",
          resource: "mx_tools",
        },
      },
    },
    {
      label: "Streams",
      routerLink: link(projectId, "project/streams"),
      state: {
        authorizationInput: {
          action: "read",
          attributes: {},
          package: "project",
          resource: "stream",
        },
      },
    },
    {
      label: "Roles",
      routerLink: link(projectId, "project/roles"),
      state: {
        authorizationInput: {
          action: "read",
          attributes: {},
          package: "authorization",
          resource: "project_role",
        },
      },
    },
    {
      label: "Automerge",
      routerLink: link(projectId, "project/automerge"),
      state: {
        authorizationInput: {
          action: "read",
          attributes: {},
          package: "scm",
          resource: "merge_configuration_definition",
        },
      },
    },
  ];

  if (configAuditEnabled) {
    items.push({
      label: "Config Audit",
      routerLink: link(projectId, "project/config-audit-settings"),
      state: {
        authorizationInput: {
          action: "read",
          attributes: {},
          package: "web",
          resource: "config_audit_settings_page",
        },
      },
    });
  }

  items.push(
    {
      label: "BP Settings",
      state: {
        authorizationInput: {
          action: "read",
          attributes: {},
          package: "web",
          resource: "business_process_settings_page",
        },
      },
      items: [
        {
          label: "Limits",
          routerLink: link(projectId, "business-process/settings/limits"),
        },
        {
          label: "Test Repushes",
          routerLink: link(projectId, "business-process/settings/repushes"),
        },
        {
          label: "Resource Retention",
          routerLink: link(
            projectId,
            "business-process/settings/resource-retention"
          ),
        },
      ],
    },
    {
      label: "Infrastructure",
      state: {
        authorizationInput: {
          action: "update",
          attributes: {},
          package: "infra",
          resource: "project",
        },
      },
      items: [
        {
          label: "Infra Settings",
          routerLink: link(projectId, `${INFRA_MFE_PATH}/settings/details`),
          state: {
            authorizationInput: {
              action: "update",
              attributes: {},
              package: "infra",
              resource: "project",
            },
          },
        },
        {
          label: "Credentials",
          routerLink: link(projectId, `${INFRA_MFE_PATH}/settings/credentials`),
          state: {
            authorizationInput: {
              action: "update",
              attributes: {},
              package: "infra",
              resource: "project",
            },
          },
        },
        {
          label: "ERP & Allocation",
          routerLink: link(
            projectId,
            `${INFRA_MFE_PATH}/settings/erp-allocations`
          ),
          state: {
            authorizationInput: {
              action: "update",
              attributes: {},
              package: "infra",
              resource: "erp",
            },
          },
        },
        {
          label: "Infra Families",
          routerLink: link(
            projectId,
            `${INFRA_MFE_PATH}/settings/infra-families`
          ),
          state: {
            authorizationInput: {
              action: "read",
              attributes: {},
              package: "infra",
              resource: "infra_family",
            },
          },
        },
      ],
    }
  );

  return items;
}
