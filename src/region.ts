/**
 * Reads the region out of a KMS key ARN.
 *
 * An ARN looks like arn:aws:kms:<region>:<account>:key/<id>, so a caller
 * passing one has already said which region the key is in. Anything else, an
 * alias or a bare key id, carries no region.
 */
export const regionFromKeyId = (keyId: string): string => {
  if (!keyId.startsWith("arn:")) {
    return "";
  }
  return keyId.split(":")[3] ?? "";
};

export type Inputs = {
  /** The aws-region input. */
  region: string;
  /** The kms-key-id input. */
  keyId: string;
};

/**
 * Works out which AWS region the KMS key is in, if the inputs say.
 *
 * Undefined means they don't, and the AWS SDK resolves it as it normally
 * would, from AWS_REGION, ~/.aws/config and so on. Nothing here duplicates
 * that, so a profile carrying a region keeps working.
 *
 * A key ARN wins over those, because it states where the key actually is
 * while they are only defaults.
 */
export const resolveRegion = (inputs: Inputs): string | undefined =>
  inputs.region || regionFromKeyId(inputs.keyId) || undefined;

/** The AWS SDK's message when it can't resolve a region. */
const missingRegion = "Region is missing";

/**
 * Explains a missing region in this action's terms.
 *
 * The SDK's own message says nothing about which of this action's inputs would
 * have answered the question.
 */
export const explainMissingRegion = (error: unknown): unknown => {
  if (error instanceof Error && error.message.includes(missingRegion)) {
    return new Error(
      `${error.message}. Set the 'aws-region' input, or pass 'kms-key-id' as a key ARN, which carries the region`,
    );
  }
  return error;
};
