# create-github-app-token-aws-kms

[![License](http://img.shields.io/badge/license-mit-blue.svg?style=flat-square)](https://raw.githubusercontent.com/suzuki-shunsuke/create-github-app-token-aws-kms/main/LICENSE)

GitHub Action to create a GitHub App installation access token, signing the
JSON Web Token with AWS KMS.

It's a drop-in alternative to
[actions/create-github-app-token](https://github.com/actions/create-github-app-token)
for apps whose private key lives in AWS KMS. The inputs and outputs follow that
action, with `private-key` replaced by `kms-key-id`.

## Why

A GitHub App private key in GitHub Secrets never expires, so anyone who obtains
it can generate installation access tokens indefinitely, for as long as the key
stays registered on the app.

Importing the key into AWS KMS removes that path. The key can never be exported,
and only the JSON Web Token signing is delegated to KMS. What a workflow can
reach is the ability to sign, not the key itself, and that ability is bounded by
an IAM policy you control and can revoke.

## Example

```yaml
permissions:
  id-token: write # Required to assume the AWS IAM role via OIDC
  contents: read

env:
  AWS_REGION: ap-northeast-1

jobs:
  example:
    runs-on: ubuntu-latest
    steps:
      - uses: suzuki-shunsuke/create-github-app-token-aws-kms@v0
        id: token
        with:
          client-id: ${{vars.APP_CLIENT_ID}}
          kms-key-id: ${{vars.KMS_KEY_ID}}
          role-to-assume: ${{vars.ROLE_TO_ASSUME}}
          permission-contents: read

      - run: gh pr list
        env:
          GH_TOKEN: ${{steps.token.outputs.token}}
```

The token is revoked when the job ends.

## AWS credentials

`role-to-assume` makes this action assume the IAM role itself with the GitHub
OIDC token. The credentials then stay inside this action and are never exported,
so later steps of the job can't see them. The session lasts 900 seconds, the
shortest AWS STS accepts.

Leave it unset to use the standard AWS credential chain instead, which is what
[aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials)
sets up. Use that action when you need any of the options it offers that this
one doesn't, such as an external ID, a session policy or a custom STS endpoint.
Note that it exports the credentials as environment variables or writes them to
`~/.aws/credentials`, where the rest of the job can read them.

The AWS region comes from the standard `AWS_REGION` environment variable.

## The KMS key

The key must be an RSA 2048 key whose usage is `SIGN_VERIFY`, created with
`--origin EXTERNAL` so that the GitHub App private key can be imported into it.
GitHub App JSON Web Tokens are fixed to RS256, which is RSASSA-PKCS1-v1_5 with
SHA-256, so no other key spec works.

The IAM role needs `kms:Sign` on that key, and nothing else.

## Inputs

| Name             | Required | Description                                                                  |
| ---------------- | -------- | ---------------------------------------------------------------------------- |
| `client-id`      |          | GitHub App Client ID. Either this or `app-id` is required                    |
| `app-id`         |          | GitHub App ID. Either this or `client-id` is required                        |
| `kms-key-id`     | ✔        | Key ID, key ARN, alias name, or alias ARN of the KMS key                     |
| `role-to-assume` |          | ARN of the AWS IAM role to assume with the GitHub OIDC token                 |
| `owner`          |          | Owner of the installation. Defaults to the current repository owner          |
| `repositories`   |          | Comma or newline-separated repositories to scope the token to                |
| `enterprise`     |          | Slug of the enterprise account. Can't be used with `owner` or `repositories` |
| `github-api-url` |          | URL of the GitHub REST API. Defaults to the current one                      |
| `permission-*`   | ✔        | The level of each permission to grant. At least one is required              |

Unlike `actions/create-github-app-token`, at least one `permission-*` input is
required. Granting a token every permission the app holds is rarely what a
workflow needs, so this action asks you to say which ones you want.

## Scope

The repositories a token reaches follow `actions/create-github-app-token`.

| `owner` | `repositories` | The token reaches                            |
| ------- | -------------- | -------------------------------------------- |
| unset   | unset          | the current repository alone                 |
| set     | unset          | every repository the installation can access |
| either  | set            | those repositories                           |

So the default is the narrowest one. Widening it to a whole installation is
something you ask for by setting `owner`.

A repository may be written as `repository` or `owner/repository`. The second
form has to agree with the resolved owner, otherwise the action fails rather
than quietly using one of the two.

`enterprise` targets the installation of an enterprise account instead, and
can't be combined with `owner` or `repositories`.

Either `client-id` or `app-id` identifies the app. GitHub accepts both as the
JSON Web Token issuer, so neither is deprecated here. `client-id` takes
precedence when both are set.

## Outputs

| Name              | Description                   |
| ----------------- | ----------------------------- |
| `token`           | The installation access token |
| `installation-id` | The installation id           |
| `app-slug`        | The slug of the GitHub App    |

## LICENSE

[MIT](LICENSE)
