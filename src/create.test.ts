import { describe, expect, it } from "vitest";
import { parseRepositories, validateTarget } from "./create";

describe("parseRepositories", () => {
  it("returns nothing for an empty input", () => {
    expect(parseRepositories("")).toEqual([]);
  });

  it("splits on commas and newlines", () => {
    expect(parseRepositories("foo,bar\nbaz")).toEqual(["foo", "bar", "baz"]);
  });

  it("trims each repository and drops the empty ones", () => {
    expect(parseRepositories(" foo , \n bar \n\n")).toEqual(["foo", "bar"]);
  });

  it("takes the name out of an owner/repository pair", () => {
    // The owner comes from the owner input, so only the name is passed on.
    expect(parseRepositories("suzuki-shunsuke/tfcmt")).toEqual(["tfcmt"]);
  });

  it("fails on a repository with too many segments", () => {
    expect(() => parseRepositories("a/b/c")).toThrowError(/Invalid repository/);
  });

  it("fails on a repository with an empty segment", () => {
    expect(() => parseRepositories("/tfcmt")).toThrowError(
      /Invalid repository/,
    );
  });
});

describe("validateTarget", () => {
  it("accepts an owner target", () => {
    expect(() =>
      validateTarget("", "suzuki-shunsuke", ["tfcmt"]),
    ).not.toThrow();
  });

  it("accepts an enterprise target", () => {
    expect(() => validateTarget("example", "", [])).not.toThrow();
  });

  it("rejects an enterprise combined with an owner", () => {
    expect(() => validateTarget("example", "suzuki-shunsuke", [])).toThrowError(
      /can't be used with 'owner' or 'repositories'/,
    );
  });

  it("rejects an enterprise combined with repositories", () => {
    expect(() => validateTarget("example", "", ["tfcmt"])).toThrowError(
      /can't be used with 'owner' or 'repositories'/,
    );
  });
});
