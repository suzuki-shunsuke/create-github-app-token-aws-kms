import * as core from "@actions/core";
import { createToken } from "./create";
import { post } from "./post";
import { explainMissingRegion } from "./region";

/**
 * The entry point of both the main step and the post step.
 *
 * action.yaml points `main` and `post` at this same file, so GitHub Actions
 * downloads one bundle instead of two and the build runs once. The main step
 * marks the state, which is how the post step knows which half to run.
 */
const run = async () => {
  if (core.getState("post")) {
    await post();
    return;
  }
  core.saveState("post", "true");
  await createToken();
};

try {
  await run();
} catch (caught) {
  const error = explainMissingRegion(caught);
  core.setFailed(
    error instanceof Error ? error.message : JSON.stringify(error),
  );
}
