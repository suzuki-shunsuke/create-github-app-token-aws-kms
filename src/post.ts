import * as core from "@actions/core";
import { hasExpired, revoke } from "@suzuki-shunsuke/github-app-token";

const run = async () => {
  if (core.getBooleanInput("skip-token-revoke")) {
    core.info("skip revoking the token");
    return;
  }
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

try {
  await run();
} catch (error) {
  // A token left unrevoked expires within an hour, so failing the job over it
  // would be worse than the warning.
  core.warning(
    `failed to revoke the token: ${
      error instanceof Error ? error.message : JSON.stringify(error)
    }`,
  );
}
