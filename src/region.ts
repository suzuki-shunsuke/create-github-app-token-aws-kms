import { regionFromKeyId } from "@suzuki-shunsuke/github-app-jwt-aws-kms";

export type Inputs = {
  /** The aws-region input. */
  region: string;
  /** The kms-key-id input. */
  keyId: string;
};

/**
 * Works out which AWS region the KMS key is in, if the inputs say.
 *
 * Undefined means they don't, and @suzuki-shunsuke/github-app-jwt-aws-kms falls
 * back to AWS_REGION or AWS_DEFAULT_REGION. Nothing here duplicates that.
 *
 * A key ARN wins over those, because it states where the key actually is while
 * they are only defaults.
 */
export const resolveRegion = (inputs: Inputs): string | undefined =>
  inputs.region || regionFromKeyId(inputs.keyId) || undefined;

/**
 * The message @suzuki-shunsuke/github-app-jwt-aws-kms throws when no input, key
 * ARN or environment variable says which region the key is in.
 */
const missingRegion = "the AWS region is unknown";

/**
 * Explains a missing region in this action's terms.
 *
 * The message names the library's own inputs, which say nothing about which of
 * this action's inputs would have answered the question.
 */
export const explainMissingRegion = (error: unknown): unknown => {
  if (error instanceof Error && error.message.includes(missingRegion)) {
    return new Error(
      `${error.message}. Set the 'aws-region' input, or pass 'kms-key-id' as a key ARN, which carries the region`,
    );
  }
  return error;
};
