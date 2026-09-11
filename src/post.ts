import * as core from "@actions/core";
import { hasExpired, revoke } from "@suzuki-shunsuke/github-app-token";

const revokeToken = async () => {
  const token = core.getState("token");
  if (!token) {
    core.info("no token to revoke");
    return;
  }
  const expiresAt = core.getState("expires-at");
  if (expiresAt && hasExpired(expiresAt)) {
    core.info("skip revoking the token as it has already expired");
    return;
  }
  core.info("revoking the token");
  await revoke(token, {
    baseUrl: core.getInput("github-api-url") || undefined,
  });
};

/**
 * Revokes the token the main step created.
 *
 * A failure is only a warning. The token expires within an hour on its own, so
 * failing the job over a failed revocation would be worse than the warning.
 */
export const post = async () => {
  try {
    await revokeToken();
  } catch (error) {
    core.warning(
      `failed to revoke the token: ${
        error instanceof Error ? error.message : JSON.stringify(error)
      }`,
    );
  }
};
