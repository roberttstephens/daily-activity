# Daily Activity Tracker

A tool to help document what you did on a given day by pulling activity from GitHub and Jira. This can be used as an aid to log time.

## Getting Started

### Prerequisites

- Install Volta
- [GitHub CLI](https://cli.github.com/) installed and authenticated
- A Jira account with API access

### Installation

1. Clone the repository:
2. `npm i`
3. `cp .env.tpl .env` and add your information.
4. Run a command like `npm run today` or `npm run start 2025-10-27`


## How it works

-It currently pulls from two sources:
 - GitHub using the gh CLI tool:
   - Commits
   - Reviewed PRs
 - Jira:
   - Tickets assigned to you where you changed status OR added comments
   - Tickets you created on that day
   - Tickets you're watching that were updated (indicates active monitoring/engagement)

It expects that all commits and PR titles will begin with a format of `jiraProjectId-ticketId: description`. For example: `AB-123: Did some thing`.
