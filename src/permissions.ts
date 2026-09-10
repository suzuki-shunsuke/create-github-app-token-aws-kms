import type { Permissions } from "@suzuki-shunsuke/github-app-token";

const prefix = "INPUT_PERMISSION-";

/**
 * Collects the permission-* inputs into a permissions object.
 *
 * GitHub Actions has no way to enumerate inputs, so the environment is scanned
 * for the variables it sets for them, the same way actions/create-github-app-token
 * does. There are over fifty permission-* inputs, and declaring each one in code
 * would mean chasing every permission GitHub adds.
 */
export const getPermissions = (
  env: NodeJS.ProcessEnv = process.env,
): Permissions => {
  const permissions: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith(prefix) || !value) {
      continue;
    }
    permissions[key.slice(prefix.length).toLowerCase().replaceAll("-", "_")] =
      value;
  }
  if (Object.keys(permissions).length === 0) {
    throw new Error(
      "At least one permission-* input is required. Granting a token every permission the GitHub App has is rarely what you want, so this action asks you to say which ones you need",
    );
  }
  return permissions as Permissions;
};
