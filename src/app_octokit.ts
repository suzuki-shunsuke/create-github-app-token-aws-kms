import * as core from "@actions/core";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { credentials } from "@suzuki-shunsuke/actions-aws-oidc";
import {
  createJwt,
  type CredentialsProvider,
} from "@suzuki-shunsuke/github-app-jwt-aws-kms";
import { resolveRegion } from "./region";

/**
 * Builds the AWS credentials used to call the KMS Sign API.
 *
 * When role-to-assume is set, the IAM role is assumed here with the GitHub OIDC
 * token, and the resulting credentials never leave this process. Later steps of
 * the job can't see them, unlike credentials that
 * aws-actions/configure-aws-credentials exports as environment variables or
 * writes to ~/.aws/credentials.
 *
 * Undefined leaves them to @suzuki-shunsuke/github-app-jwt-aws-kms, which reads
 * AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_SESSION_TOKEN, so
 * aws-actions/configure-aws-credentials works as well.
 */
const newCredentials = (
  region: string | undefined,
): CredentialsProvider | undefined => {
  const roleArn = core.getInput("role-to-assume");
  if (!roleArn) {
    return undefined;
  }
  core.info(`assuming an AWS IAM role with the GitHub OIDC token: ${roleArn}`);
  return credentials({ roleArn, region });
};

/**
 * Builds an Octokit client authenticated as the GitHub App.
 *
 * The private key never leaves AWS KMS. Only the JSON Web Token signing is
 * delegated to it.
 *
 * The app is identified by either client-id or app-id. @octokit/auth-app passes
 * the value straight through as the JSON Web Token issuer, and GitHub accepts
 * both, recommending the Client ID.
 */
export const newAppOctokit = (): Octokit => {
  const appId = core.getInput("client-id") || core.getInput("app-id");
  if (!appId) {
    throw new Error("Either client-id or app-id is required");
  }
  const keyId = core.getInput("kms-key-id", { required: true });
  const region = resolveRegion({ region: core.getInput("aws-region"), keyId });
  return new Octokit({
    baseUrl: core.getInput("github-api-url") || undefined,
    authStrategy: createAppAuth,
    auth: {
      appId,
      createJwt: createJwt({
        keyId,
        region,
        credentials: newCredentials(region),
      }),
    },
  });
};
