/* eslint-disable camelcase */
const github = require('@actions/github');
const core = require('@actions/core');

const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
const DESTINATION_BRANCH = core.getInput('DESTINATION_BRANCH');
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
  console.log(JSON.stringify(context));
  try {
    const { message } = context?.payload?.head_commit;

    if (!message || !branch_name || branch_name === '') {
      const branch = context?.payload?.ref?.split('/');
      branch_name = branch[branch.length - 1];
    }
    await checkCompareCommits({
      head: branch_name,
      owner: context?.payload?.repository?.owner,
      full_name: context?.payload?.repository,
      repo: context?.payload?.repository?.name,
    });
  } catch (e) {
    console.log('FAILED', e);
    core.setFailed(e.message);
  }
};
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
  } catch (error) {
    console.log(error.message);
    let options = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'New notification sent from github actions',
            emoji: true,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `❌ failed to create pull request to ${base} due to - ${error?.message}`,
            },
          ],
        },
      ],
    };
    /*axios
      .post(SLACK_WEBHOOK_URL, JSON.stringify(options))
      .then((response) => {
        console.log('SUCCEEDED: Sent slack webhook', response.data);
      })
      .catch((error) => {
        console.log('FAILED: Send slack webhook', error);
      });*/
  }
};
run();
