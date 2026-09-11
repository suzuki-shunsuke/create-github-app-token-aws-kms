import { describe, expect, it } from "vitest";
import { getPermissions } from "./permissions";

describe("getPermissions", () => {
  it("collects the permission-* inputs", () => {
    expect(
      getPermissions({
        "INPUT_PERMISSION-CONTENTS": "read",
        "INPUT_PERMISSION-ISSUES": "write",
      }),
    ).toEqual({ contents: "read", issues: "write" });
  });

  it("turns the dashes of an input name into underscores", () => {
    // GitHub names the permission pull_requests, the input permission-pull-requests.
    expect(
      getPermissions({ "INPUT_PERMISSION-PULL-REQUESTS": "write" }),
    ).toEqual({ pull_requests: "write" });
  });

  it("lowercases the permission name", () => {
    // GitHub Actions uppercases input names in the environment.
    expect(getPermissions({ "INPUT_PERMISSION-Contents": "read" })).toEqual({
      contents: "read",
    });
  });

  it("ignores inputs which aren't permissions", () => {
    expect(
      getPermissions({
        "INPUT_PERMISSION-CONTENTS": "read",
        "INPUT_CLIENT-ID": "Iv23li",
        "INPUT_KMS-KEY-ID": "alias/example",
        GITHUB_REPOSITORY_OWNER: "suzuki-shunsuke",
      }),
    ).toEqual({ contents: "read" });
  });

  it("ignores a permission set to an empty string", () => {
    // An input the workflow leaves out still reaches the action as empty.
    expect(
      getPermissions({
        "INPUT_PERMISSION-CONTENTS": "read",
        "INPUT_PERMISSION-ISSUES": "",
      }),
    ).toEqual({ contents: "read" });
  });

  it("fails if no permission is set", () => {
    expect(() => getPermissions({})).toThrowError(
      /At least one permission-\* input is required/,
    );
  });

  it("fails if every permission is empty", () => {
    expect(() =>
      getPermissions({ "INPUT_PERMISSION-CONTENTS": "" }),
    ).toThrowError(/At least one permission-\* input is required/);
  });
});
