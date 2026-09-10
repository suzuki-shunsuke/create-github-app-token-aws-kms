import * as core from "@actions/core";
import { KMSClient } from "@aws-sdk/client-kms";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { credentials } from "@suzuki-shunsuke/actions-aws-oidc";
import { createJwt } from "@suzuki-shunsuke/github-app-jwt-aws-kms";

/**
 * Builds a KMS client.
 *
 * When role-to-assume is set, the IAM role is assumed here with the GitHub OIDC
 * token, and the resulting credentials never leave this process. Later steps of
 * the job can't see them, unlike credentials that
 * aws-actions/configure-aws-credentials exports as environment variables or
 * writes to ~/.aws/credentials.
 *
 * Otherwise the standard AWS credential chain is used, so
 * aws-actions/configure-aws-credentials works as well.
 */
const newKMSClient = (): KMSClient => {
  const roleArn = core.getInput("role-to-assume");
  if (!roleArn) {
    return new KMSClient({});
  }
  core.info(`assuming an AWS IAM role with the GitHub OIDC token: ${roleArn}`);
  return new KMSClient({ credentials: credentials({ roleArn }) });
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
  return new Octokit({
    baseUrl: core.getInput("github-api-url") || undefined,
    authStrategy: createAppAuth,
    auth: {
      appId,
      createJwt: createJwt({ keyId, client: newKMSClient() }),
    },
  });
};
