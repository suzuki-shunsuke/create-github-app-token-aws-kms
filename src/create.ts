import * as core from "@actions/core";
import { create } from "@suzuki-shunsuke/github-app-token";
import { newAppOctokit } from "./app_octokit";
import { getPermissions } from "./permissions";
import { resolveTarget } from "./target";

export const createToken = async () => {
  const permissions = getPermissions();
  const target = resolveTarget({
    enterprise: core.getInput("enterprise"),
    owner: core.getInput("owner"),
    repositories: core.getInput("repositories"),
    githubRepository: process.env["GITHUB_REPOSITORY"] ?? "",
    githubRepositoryOwner: process.env["GITHUB_REPOSITORY_OWNER"] ?? "",
  });

  const octokit = newAppOctokit();

  if ("enterprise" in target) {
    core.info(`creating a token for the enterprise ${target.enterprise}`);
  } else {
    core.info(
      `creating a token for ${target.owner} (${
        target.repositories
          ? target.repositories.join(", ")
          : "every repository of the installation"
      })`,
    );
  }

  const token = await create({ octokit, permissions, ...target });

  core.setSecret(token.token);
  core.setOutput("token", token.token);
  core.setOutput("installation-id", token.installationId);
  core.setOutput("app-slug", token.appSlug);

  // The post step reads these to revoke the token.
  core.saveState("token", token.token);
  core.saveState("expires-at", token.expiresAt);
};
