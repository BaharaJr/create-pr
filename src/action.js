/* eslint-disable camelcase */
const github = require('@actions/github');
const core = require('@actions/core');

const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
const DESTINATION_BRANCH = core.getInput('DESTINATION_BRANCH');
const KEYWORD = core.getInput('KEYWORD');
const octokit = github.getOctokit(GITHUB_TOKEN);
const { context = {} } = github;

async function run() {
  const eventName = context.eventName;
  switch (eventName) {
    case 'push':
      return pr();
    case 'pull_request':
      core.warning(
        `Event <${context.eventName}> is still WIP and will be available soon. Please submit an issue to the repo for quick delivery.`,
      );
      break;
    default:
      core.warning(
        `Event <${context.eventName}> is still WIP and will be available soon. Please submit an issue to the repo for quick delivery.`,
      );
      break;
  }
}
const checkCompareCommits = async ({ head, owner, full_name, repo }) => {
  let commits = '';
  const compare_commits = await octokit.request(
    `GET /repos/${full_name}/compare/${DESTINATION_BRANCH}...${head}`,
    {
      owner,
      repo,
      base: DESTINATION_BRANCH,
      head,
    },
  );
  console.log(commits);
  if (compare_commits?.data?.commits?.length === 0) {
    core.warning('Trigger has no commit');
    return;
  }

  compare_commits?.data?.commits?.forEach((e, i) => {
    if (
      !e?.commit?.message.includes('Merge') &&
      !e?.commit?.message.includes('Merged') &&
      !e?.commit?.message.includes('skip') &&
      !e?.commit?.message.includes('Skip')
    )
      commits =
        i === 0
          ? '> ' + e.commit.message
          : commits + '\n\n' + '> ' + e.commit.message;
  });
};
const pr = async () => {
  try {
    const { message } = context?.payload?.head_commit;
    const branch = context?.payload?.ref?.split('/');
    if (!message.includes(KEYWORD)) {
      core.warning('Not release commit');
      return;
    }
    branch_name = branch[branch.length - 1];
    await checkCompareCommits({
      head: branch_name,
      owner: context?.payload?.repository?.owner,
      full_name: context?.payload?.repository,
      repo: context?.payload?.repository?.name,
    });
  } catch (e) {
    core.setFailed(e.message);
  }
};
run();
