import { describe, expect, it } from "vitest";
import { roleSessionName } from "./session_name";

/** The pattern AWS STS validates a role session name against. */
const valid = /^[\w+=,.@-]{2,64}$/;

describe("roleSessionName", () => {
  it("names the run and the attempt", () => {
    expect(roleSessionName({ runId: "17251230", runAttempt: "1" })).toBe(
      "gha-17251230-1",
    );
  });

  it("builds a name AWS STS accepts", () => {
    expect(roleSessionName({ runId: "17251230", runAttempt: "1" })).toMatch(
      valid,
    );
  });

  it("tells a re-run apart from the run it re-ran", () => {
    expect(roleSessionName({ runId: "17251230", runAttempt: "2" })).not.toBe(
      roleSessionName({ runId: "17251230", runAttempt: "1" }),
    );
  });

  it("replaces characters AWS STS rejects", () => {
    // GitHub only sets digits here. The action shouldn't fail the job if that
    // ever changes.
    expect(roleSessionName({ runId: "17251230/1", runAttempt: "1" })).toBe(
      "gha-17251230_1-1",
    );
  });

  it("works outside GitHub Actions, where the variables aren't set", () => {
    expect(roleSessionName({ runId: "", runAttempt: "" })).toBe("gha");
    expect(roleSessionName({ runId: "17251230", runAttempt: "" })).toBe(
      "gha-17251230",
    );
  });
});
