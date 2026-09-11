/**
 * Which installation the token is for, and which repositories it reaches.
 *
 * This mirrors actions/create-github-app-token so that a workflow moving over
 * keeps the scope it had.
 */
export type Target =
  { enterprise: string } | { owner: string; repositories?: string[] };

type ParsedRepository = {
  input: string;
  owner: string;
  name: string;
};

const parseRepository = (input: string): ParsedRepository => {
  const parts = input.split("/");
  if (parts.length === 1 && parts[0]) {
    return { input, owner: "", name: parts[0] };
  }
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { input, owner: parts[0], name: parts[1] };
  }
  throw new Error(
    `Invalid repository '${input}'. Expected 'repository' or 'owner/repository'`,
  );
};

/** Splits the repositories input on commas and newlines. */
export const parseRepositories = (input: string): ParsedRepository[] =>
  input
    .split(/[\n,]+/)
    .map((repository) => repository.trim())
    .filter((repository) => repository !== "")
    .map(parseRepository);

export type Inputs = {
  enterprise: string;
  owner: string;
  repositories: string;
  /** $GITHUB_REPOSITORY, as "owner/repository". */
  githubRepository: string;
  /** $GITHUB_REPOSITORY_OWNER. */
  githubRepositoryOwner: string;
};

/**
 * Works out the installation and the repository scope from the inputs.
 *
 * The four cases come from actions/create-github-app-token:
 *
 * - enterprise: the installation of an enterprise account
 * - neither owner nor repositories: this repository alone
 * - owner alone: every repository the installation can reach
 * - repositories, with or without owner: those repositories
 */
export const resolveTarget = (inputs: Inputs): Target => {
  const repositories = parseRepositories(inputs.repositories);

  if (inputs.enterprise) {
    if (inputs.owner || repositories.length > 0) {
      throw new Error(
        "The 'enterprise' input can't be used with 'owner' or 'repositories'",
      );
    }
    return { enterprise: inputs.enterprise };
  }

  if (!inputs.owner && repositories.length === 0) {
    const [owner, repository] = inputs.githubRepository.split("/");
    if (!owner || !repository) {
      throw new Error(
        "GITHUB_REPOSITORY is missing, so the 'owner' input is required",
      );
    }
    return { owner, repositories: [repository] };
  }

  if (inputs.owner && repositories.length === 0) {
    return { owner: inputs.owner };
  }

  const owner = inputs.owner || inputs.githubRepositoryOwner;
  if (!owner) {
    throw new Error(
      "GITHUB_REPOSITORY_OWNER is missing, so the 'owner' input is required",
    );
  }
  const mismatched = repositories.find(
    (repository) =>
      repository.owner &&
      repository.owner.toLowerCase() !== owner.toLowerCase(),
  );
  if (mismatched) {
    throw new Error(
      `Repository '${mismatched.input}' includes owner '${mismatched.owner}', which doesn't match the resolved owner '${owner}'`,
    );
  }
  return { owner, repositories: repositories.map(({ name }) => name) };
};
