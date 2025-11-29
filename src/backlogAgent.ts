// src/backlogAgent.ts
import { Agent } from "agents";

export type IssueStatus = "open" | "in_progress" | "done" | "cancelled";

export type Issue = {
  id: string;
  title: string;
  status: IssueStatus;
  url?: string;
};

export type BacklogState = {
  issues: Issue[];
  notes: string[];
  lastUpdated: string | null;
};

// Only bindings the Agent itself needs
export interface BacklogEnv {
  // `Ai` type is generated in worker-configuration.d.ts by C3
  AI: Ai;
}

export class BacklogAgent extends Agent<BacklogEnv, BacklogState> {
  async onStart(): Promise<void> {
    if (!this.state || !this.state.issues) {
      this.setState({
        issues: this.seedIssues(),
        notes: [],
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private seedIssues(): Issue[] {
    return [
      {
        id: "CF-4242",
        title:
          "Implement and open a pull request for the first issue assigned to me",
        status: "open",
        url: "https://example.com/your-issue-tracker/CF-4242",
      },
      {
        id: "CF-4243",
        title:
          "Clean up backlog, cancelling any issues that are no longer relevant",
        status: "open",
      },
      {
        id: "CF-4244",
        title: "Document how our Agents are wired into Workers AI",
        status: "in_progress",
      },
    ];
  }

  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname.endsWith("/state")) {
      return new Response(JSON.stringify(this.state, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (request.method === "POST" && url.pathname.endsWith("/chat")) {
      const body = (await request.json()) as {
        message?: string;
        user?: string;
      };

      if (!body.message) {
        return new Response(
          JSON.stringify({ error: 'Missing "message" field in body' }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const user = body.user ?? "anonymous";
      const reply = await this.handleChatMessage(body.message, user);

      return new Response(
        JSON.stringify({ reply, state: this.state }, null, 2),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response("Not found", { status: 404 });
  }

  private async handleChatMessage(
    message: string,
    user: string,
  ): Promise<string> {
    const issues = this.state.issues ?? [];
    const notes = this.state.notes ?? [];

    const updatedNotes = [
      ...notes,
      `[${new Date().toISOString()}][${user}] ${message}`,
    ];

    const systemContext = `
You are Backlog Buddy, an engineering assistant that helps a developer
triage and act on their issue backlog.

Goals:
- Look at the list of issues and their statuses.
- When asked to "implement and open a PR for the first issue", outline concrete steps:
  - Identify the first OPEN issue.
  - Suggest git branch name, commands and a checklist.
- When asked to "clean up backlog", propose which issues to close or cancel.
- Keep answers concise but structured with bullet points.
- Never invent real API tokens, passwords or secrets.
`;

    const issuesSummary = issues
      .map(
        (i) =>
          `- [${i.status}] ${i.id}: ${i.title}${i.url ? ` (${i.url})` : ""}`,
      )
      .join("\n");

    const userPrompt = `
Current backlog:
${issuesSummary || "(no issues yet)"}

Recent notes:
${updatedNotes.slice(-5).join("\n") || "(none)"}

User message:
"${message}"

Respond with clear next steps and, when relevant, example git commands.
`;

    const { response } = await this.env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {
        messages: [
          { role: "system", content: systemContext },
          { role: "user", content: userPrompt },
        ],
      },
    );

    const answer =
      typeof response === "string"
        ? response
        : JSON.stringify(response, null, 2);

    this.setState({
      issues,
      notes: updatedNotes,
      lastUpdated: new Date().toISOString(),
    });

    return answer;
  }

  async cleanupStaleNotes(): Promise<void> {
    const notes = this.state.notes ?? [];
    if (notes.length > 50) {
      this.setState({
        ...this.state,
        notes: notes.slice(-50),
        lastUpdated: new Date().toISOString(),
      });
    }
  }
}