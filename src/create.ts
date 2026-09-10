import * as core from "@actions/core";
import { create } from "@suzuki-shunsuke/github-app-token";
import { newAppOctokit } from "./app_octokit";
import { getPermissions } from "./permissions";

export const parseRepositories = (input: string): string[] =>
  input
    .split(/[\n,]+/)
    .map((repository) => repository.trim())
    .filter((repository) => repository !== "")
    .map((repository) => {
      const parts = repository.split("/");
      if (parts.length === 1) {
        return parts[0];
      }
      if (parts.length === 2 && parts[0] && parts[1]) {
        return parts[1];
      }
      throw new Error(
        `Invalid repository '${repository}'. Expected 'repository' or 'owner/repository'`,
      );
    });

/**
 * Rejects an enterprise target combined with an owner or repository one.
 *
 * They select different installations, so GitHub would answer about whichever
 * this action happened to ask for, which is worse than saying no.
 */
export const validateTarget = (
  enterprise: string,
  owner: string,
  repositories: string[],
) => {
  if (enterprise && (owner || repositories.length > 0)) {
    throw new Error(
      "The 'enterprise' input can't be used with 'owner' or 'repositories'",
    );
  }
};

export const createToken = async () => {
  const permissions = getPermissions();
  const enterprise = core.getInput("enterprise");
  const owner = core.getInput("owner");
  const repositories = parseRepositories(core.getInput("repositories"));

  validateTarget(enterprise, owner, repositories);

  const octokit = newAppOctokit();

  const token = await (enterprise
    ? (() => {
        core.info(`creating a token for the enterprise ${enterprise}`);
        return create({ octokit, enterprise, permissions });
      })()
    : (() => {
        const resolvedOwner = owner || process.env["GITHUB_REPOSITORY_OWNER"];
        if (!resolvedOwner) {
          throw new Error(
            "GITHUB_REPOSITORY_OWNER is missing, so the 'owner' input is required",
          );
        }
        // With no repositories the token reaches every repository the
        // installation can access, which matches actions/create-github-app-token.
        const resolvedRepositories =
          repositories.length > 0 ? repositories : undefined;
        core.info(
          `creating a token for ${resolvedOwner}${
            resolvedRepositories
              ? ` (${resolvedRepositories.join(", ")})`
              : " (every repository of the installation)"
          }`,
        );
        return create({
          octokit,
          owner: resolvedOwner,
          repositories: resolvedRepositories,
          permissions,
        });
      })());

  core.setSecret(token.token);
  core.setOutput("token", token.token);
  core.setOutput("installation-id", token.installationId);
  core.setOutput("app-slug", token.appSlug);

  // The post step reads these to revoke the token.
  core.saveState("token", token.token);
  core.saveState("expires-at", token.expiresAt);
};
