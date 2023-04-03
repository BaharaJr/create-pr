![Workflow Status](https://github.com/BaharaJr/create-pr/actions/workflows/test.yml/badge.svg)

# Automatically Merge Pull Requests

## Requirements

- This runner requires a GitHub token for a user with write access to the repo, a destination branch, and the keyword in the commit to determine PR creation.
- The token is passed as a secret in settings for actions' secrets with name `GITHUB_TOKEN`
- Destination branch is passed as `DESTINATION_BRANCH`
- The commit keyword is passed as `KEYWORD`

## Roadmap

- We look forward to adding more functions in the future, feel free to drop an issue for any features you might want added.

## Contributing

Contributions are always welcome and highly encourage!
