import { google } from "googleapis";
import type { ExternalTaskCandidateDTO } from "@shared/types";
import { getAuthenticatedClient } from "./google-auth";

export async function importTasks(): Promise<ExternalTaskCandidateDTO[]> {
  const auth = await getAuthenticatedClient();
  if (!auth) throw new Error("Google not connected");

  const tasksApi = google.tasks({ version: "v1", auth });
  const taskListsRes = await tasksApi.tasklists.list({ maxResults: 100 });
  const taskLists = taskListsRes.data.items ?? [];

  const results: ExternalTaskCandidateDTO[] = [];

  for (const list of taskLists) {
    if (!list.id) continue;

    const tasksRes = await tasksApi.tasks.list({
      tasklist: list.id,
      showCompleted: false,
      showDeleted: false,
      showHidden: false,
      maxResults: 100
    });

    for (const task of tasksRes.data.items ?? []) {
      if (!task.id || !task.title) continue;

      results.push({
        taskId: task.id,
        taskListId: list.id,
        title: task.title,
        note: task.notes ?? undefined
      });
    }
  }

  return results;
}
