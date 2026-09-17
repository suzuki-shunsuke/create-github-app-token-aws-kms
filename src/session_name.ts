/**
 * The prefix marking a session this action created.
 *
 * https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html
 * caps a role session name at 64 characters and validates it against
 * [\w+=,.@-], so a slash can't separate the parts and the name has to stay
 * short. A run id and an attempt number always fit.
 */
const prefix = "gha";

/** The separator between the parts of the name. */
const separator = "-";

/**
 * Characters AWS STS rejects in a role session name.
 *
 * A run id and an attempt number are digits, so this replaces nothing. It's
 * here so that a value STS would reject can't reach it and fail the whole job.
 */
const invalid = /[^\w+=,.@-]/g;

export type Inputs = {
  /** The GITHUB_RUN_ID environment variable. */
  runId: string;
  /** The GITHUB_RUN_ATTEMPT environment variable. */
  runAttempt: string;
};

/**
 * Builds the AWS role session name.
 *
 * CloudTrail records the session name on every call the session makes, so
 * naming the run here is what lets an administrator read a kms:Sign event and
 * tell which workflow run asked for that signature. The default name of
 * aws-actions/configure-aws-credentials, "GitHubActions", is the same for every
 * run of every repository, so an event carrying it says nothing beyond the role
 * that was assumed. That matters for a GitHub App signing key, where the token
 * the signature produces acts as the app rather than as whoever asked for it.
 *
 * The owner and the repository are left out. A run id is unique across GitHub,
 * and the AssumeRoleWithWebIdentity event that opened the session records the
 * sub claim of the OIDC token, which names the repository. Joining the two
 * events on the access key id of the session gets there, whereas fitting a
 * repository name into what's left of 64 characters would sometimes truncate it,
 * and a name that is sometimes complete and sometimes not is worse than one
 * that never is.
 *
 * The attempt number distinguishes a re-run from the run it re-ran.
 */
export const roleSessionName = (inputs: Inputs): string =>
  [prefix, inputs.runId, inputs.runAttempt]
    .map((part) => part.replace(invalid, "_"))
    .filter((part) => part !== "")
    .join(separator);
