import { describe, expect, it } from "vitest";
import { parseRepositories, resolveTarget } from "./target";

const inputs = {
  enterprise: "",
  owner: "",
  repositories: "",
  githubRepository: "suzuki-shunsuke/tfcmt",
  githubRepositoryOwner: "suzuki-shunsuke",
};

describe("parseRepositories", () => {
  it("returns nothing for an empty input", () => {
    expect(parseRepositories("")).toEqual([]);
  });

  it("splits on commas and newlines", () => {
    expect(parseRepositories("foo,bar\nbaz").map((r) => r.name)).toEqual([
      "foo",
      "bar",
      "baz",
    ]);
  });

  it("trims each repository and drops the empty ones", () => {
    expect(parseRepositories(" foo , \n bar \n\n").map((r) => r.name)).toEqual([
      "foo",
      "bar",
    ]);
  });

  it("keeps the owner of an owner/repository pair", () => {
    expect(parseRepositories("suzuki-shunsuke/tfcmt")).toEqual([
      {
        input: "suzuki-shunsuke/tfcmt",
        owner: "suzuki-shunsuke",
        name: "tfcmt",
      },
    ]);
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

describe("resolveTarget", () => {
  it("scopes the token to this repository when neither owner nor repositories is set", () => {
    // This is the default of actions/create-github-app-token, and the reason
    // an unscoped token isn't handed out by accident.
    expect(resolveTarget(inputs)).toEqual({
      owner: "suzuki-shunsuke",
      repositories: ["tfcmt"],
    });
  });

  it("reaches every repository of the installation when only owner is set", () => {
    expect(resolveTarget({ ...inputs, owner: "aquaproj" })).toEqual({
      owner: "aquaproj",
    });
  });

  it("scopes the token to the given repositories", () => {
    expect(
      resolveTarget({
        ...inputs,
        owner: "aquaproj",
        repositories: "aqua,aqua-registry",
      }),
    ).toEqual({ owner: "aquaproj", repositories: ["aqua", "aqua-registry"] });
  });

  it("falls back to the repository owner when only repositories is set", () => {
    expect(
      resolveTarget({ ...inputs, repositories: "tfcmt,tfaction" }),
    ).toEqual({
      owner: "suzuki-shunsuke",
      repositories: ["tfcmt", "tfaction"],
    });
  });

  it("accepts an owner/repository pair matching the owner", () => {
    expect(
      resolveTarget({ ...inputs, repositories: "suzuki-shunsuke/tfcmt" }),
    ).toEqual({ owner: "suzuki-shunsuke", repositories: ["tfcmt"] });
  });

  it("ignores the case of the owner in an owner/repository pair", () => {
    expect(
      resolveTarget({ ...inputs, repositories: "Suzuki-Shunsuke/tfcmt" }),
    ).toEqual({ owner: "suzuki-shunsuke", repositories: ["tfcmt"] });
  });

  it("rejects an owner/repository pair belonging to another owner", () => {
    expect(() =>
      resolveTarget({
        ...inputs,
        owner: "aquaproj",
        repositories: "suzuki-shunsuke/tfcmt",
      }),
    ).toThrowError(/doesn't match the resolved owner 'aquaproj'/);
  });

  it("targets an enterprise", () => {
    expect(resolveTarget({ ...inputs, enterprise: "example" })).toEqual({
      enterprise: "example",
    });
  });

  it("rejects an enterprise combined with an owner", () => {
    expect(() =>
      resolveTarget({ ...inputs, enterprise: "example", owner: "aquaproj" }),
    ).toThrowError(/can't be used with 'owner' or 'repositories'/);
  });

  it("rejects an enterprise combined with repositories", () => {
    expect(() =>
      resolveTarget({
        ...inputs,
        enterprise: "example",
        repositories: "tfcmt",
      }),
    ).toThrowError(/can't be used with 'owner' or 'repositories'/);
  });

  it("fails when GITHUB_REPOSITORY is missing and nothing is set", () => {
    expect(() =>
      resolveTarget({ ...inputs, githubRepository: "" }),
    ).toThrowError(/GITHUB_REPOSITORY is missing/);
  });

  it("fails when GITHUB_REPOSITORY_OWNER is missing and only repositories is set", () => {
    expect(() =>
      resolveTarget({
        ...inputs,
        repositories: "tfcmt",
        githubRepositoryOwner: "",
      }),
    ).toThrowError(/GITHUB_REPOSITORY_OWNER is missing/);
  });
});
