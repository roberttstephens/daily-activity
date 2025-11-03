A tool to help document what you did on a given day. This can be used as an aid to log time.

It currently pulls from two sources:
 - GitHub:
   - Commits
   - Reviewed PRs
 - Jira:
   - Tickets assigned to you where you changed status OR added comments
   - Tickets you created on that day
   - Tickets you're watching that were updated (indicates active monitoring/engagement)

It expects that all commits and PR titles will begin with a format of `jiraProjectId-ticketId: description`. For example: `AB-123: Did some thing`.
