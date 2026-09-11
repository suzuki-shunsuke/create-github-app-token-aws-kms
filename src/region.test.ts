import { describe, expect, it } from "vitest";
import { explainMissingRegion, regionFromKeyId, resolveRegion } from "./region";

const arn =
  "arn:aws:kms:ap-northeast-1:455828037039:key/bac566a7-22c2-4abd-8b50-5136a4a748a8";

describe("regionFromKeyId", () => {
  it("reads the region out of a key ARN", () => {
    expect(regionFromKeyId(arn)).toBe("ap-northeast-1");
  });

  it("reads the region out of an alias ARN", () => {
    expect(
      regionFromKeyId("arn:aws:kms:us-east-1:455828037039:alias/example"),
    ).toBe("us-east-1");
  });

  it("returns nothing for a bare key id", () => {
    expect(regionFromKeyId("bac566a7-22c2-4abd-8b50-5136a4a748a8")).toBe("");
  });

  it("returns nothing for an alias name", () => {
    expect(regionFromKeyId("alias/example")).toBe("");
  });
});

describe("resolveRegion", () => {
  it("prefers the input", () => {
    expect(resolveRegion({ region: "us-west-2", keyId: arn })).toBe(
      "us-west-2",
    );
  });

  it("falls back to the region in the key ARN", () => {
    expect(resolveRegion({ region: "", keyId: arn })).toBe("ap-northeast-1");
  });

  it("leaves it to the AWS SDK when the inputs don't say", () => {
    // Returning undefined is what keeps AWS_REGION and a profile working.
    expect(
      resolveRegion({ region: "", keyId: "alias/example" }),
    ).toBeUndefined();
  });
});

describe("explainMissingRegion", () => {
  it("adds the inputs which would have answered the question", () => {
    const explained = explainMissingRegion(new Error("Region is missing"));
    expect((explained as Error).message).toMatch(/Set the 'aws-region' input/);
    expect((explained as Error).message).toMatch(
      /key ARN, which carries the region/,
    );
  });

  it("leaves any other error alone", () => {
    const error = new Error("Something else");
    expect(explainMissingRegion(error)).toBe(error);
  });

  it("leaves a non-error alone", () => {
    expect(explainMissingRegion("boom")).toBe("boom");
  });
});
