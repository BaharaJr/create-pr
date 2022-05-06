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
const createorupdatepr = async ({ branch, owner, repo, body, full_name }) => {
  try {
    const existing_pr = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'open',
      head: owner + ':' + branch,
      base: DESTINATION_BRANCH,
    });
    if (existing_pr?.data?.length === 0) {
      // create new pr
      const createpr = await octokit.request(`POST /repos/${full_name}/pulls`, {
        owner,
        repo,
        title: branch,
        body,
        head: branch,
        base: DESTINATION_BRANCH,
      });
      return createpr;
    } else {
      // update existing pr
      const updatepr = await octokit.rest.pulls.update({
        pull_number: existing_pr?.data[0].number,
        owner,
        repo,
        title: branch,
        body,
        head: branch,
        base: DESTINATION_BRANCH,
      });
      return updatepr;
    }
  } catch (e) {
    core.setFailed(e.message);
  }
};
const checkCompareCommits = async ({ head, owner, full_name, repo }) => {
  try {
    let { commits } = (
      await octokit.request(
        `GET /repos/${full_name}/compare/${DESTINATION_BRANCH}...${head}`,
        {
          owner,
          repo,
          base: DESTINATION_BRANCH,
          head,
        },
      )
    ).data;
    if ((commits || []).length === 0) {
      core.warning('Trigger has no commit');
      return;
    }

    commits = (commits || [])
      .map((e, i) => {
        return i === 0 ? '> ' + e.commit.message : e.commit.message;
      })
      .join('\n\n' + '> ');

    await createorupdatepr({
      branch: head,
      owner,
      repo,
      full_name,
      body: commits,
    });
  } catch (e) {
    core.setFailed(e.message);
  }
};
const pr = async () => {
  try {
    const { message } = context?.payload?.head_commit;
    const branch = context?.payload?.ref?.split('/');
    if (!message.includes(KEYWORD)) {
      core.info('Not a PR message');
      return;
    }
    await checkCompareCommits({
      head: branch[branch.length - 1],
      owner: context?.payload?.repository?.owner?.login,
      full_name: context?.payload?.repository?.full_name,
      repo: context?.payload?.repository?.name,
    });
  } catch (e) {
    core.setFailed(e.message);
  }
};
run();
