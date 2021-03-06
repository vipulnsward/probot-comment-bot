import {Application, Context} from 'probot' // eslint-disable-line no-unused-vars
import {trim, isEqual} from "lodash";

const extractAssignee = (body: String) => {
    const regex = /@[\w-]+\s_(a|A)/g;
    const assigneeComment = body.replace(/\n|\r/g, "").match(regex);
    if (!!assigneeComment) {
        const assigneeStr = assigneeComment[0]
        return [trim(assigneeStr.split(" ")[0].replace("@", ""))];
    } else {
        return []
    }
}

const performAssignment = async (context: Context<any>, newAssignees: Array<string>) => {
    if (newAssignees.length > 0) {
        // First remove all existing assignees
        const currentIssue = await context.github.issues.get(context.issue())
        const currentAssignees = await currentIssue.data.assignees.map(user => user.login)
        if (isEqual(currentAssignees, newAssignees)) {
            console.log("Already assigned, doing nothing.")
            // Do nothing
        } else {
            console.log("Performing Assignment for ", newAssignees)
            // Remove all existing assignee
            await context.github.issues.removeAssignees(context.issue({assignees: currentIssue.data.assignees.map(user => user.login)}))
            // Then assign new ones
            const newAssignee = context.issue({assignees: newAssignees});
            await context.github.issues.addAssignees(newAssignee)
        }
    }
}

// For more information on building apps:
// https://probot.github.io/docs/

// To get your app running against GitHub, see:
// https://probot.github.io/docs/development/

export = (app: Application) => {
    app.on(['issues.opened', 'issues.edited'], async (context) => {
        console.log(context.payload)
        const description = context.payload.issue.body;
        const newAssignees = extractAssignee(description)

        performAssignment(context, newAssignees)
    })

    app.on('issue_comment', async (context) => {
        console.log(context.payload)
        const description = context.payload.issue.body;
        const newAssignees = extractAssignee(description)

        performAssignment(context, newAssignees)
    })

    app.on(['pull_request.opened', 'pull_request.edited'], async (context) => {
        console.log(context.payload)
        const description = context.payload.pull_request.body;
        const newAssignees = extractAssignee(description)

        performAssignment(context, newAssignees)
    })

    app.on(['pull_request_review_comment.created', 'pull_request_review_comment.edited'], async (context) => {
        console.log(context.payload)
        const description = context.payload.comment.body;
        const newAssignees = extractAssignee(description)

        performAssignment(context, newAssignees)
    })

    app.on('pull_request_review.submitted', async (context) => {
        console.log(context.payload)
        const description = context.payload.review.body;
        const newAssignees = extractAssignee(description || "")

        performAssignment(context, newAssignees)
    })
}
