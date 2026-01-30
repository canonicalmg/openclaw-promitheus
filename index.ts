import { execSync } from "child_process";

export default function register(api: any) {
  api.logger.info("Promitheus plugin loaded!");

  // Get current emotional state
  api.registerTool({
    name: "promitheus_status",
    description: "Check current Promitheus emotional state (mood, valence, energy, arousal)",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    execute: async () => {
      try {
        const output = execSync("promitheus status", { encoding: "utf-8" });
        return { status: "ok", output: output.trim() };
      } catch (e: any) {
        return { status: "error", error: e.message };
      }
    },
  });

  // Sync state (apply decay + generate thoughts)
  api.registerTool({
    name: "promitheus_sync",
    description: "Sync Promitheus state - applies decay and generates inner monologue thoughts",
    parameters: {
      type: "object", 
      properties: {},
      required: [],
    },
    execute: async () => {
      try {
        const output = execSync("promitheus sync", { encoding: "utf-8" });
        return { status: "ok", output: output.trim() };
      } catch (e: any) {
        return { status: "error", error: e.message };
      }
    },
  });

  // Generate inner monologue
  api.registerTool({
    name: "promitheus_think",
    description: "Generate inner monologue thoughts based on current state, memories, and goals",
    parameters: {
      type: "object",
      properties: {
        count: {
          type: "number",
          description: "Number of thoughts to generate (default: 3)",
        },
      },
      required: [],
    },
    execute: async (params: { count?: number }) => {
      try {
        const count = params.count || 3;
        const output = execSync(`promitheus think --count ${count}`, { encoding: "utf-8" });
        return { status: "ok", thoughts: output.trim().split("\n") };
      } catch (e: any) {
        return { status: "error", error: e.message };
      }
    },
  });

  // Log an event
  api.registerTool({
    name: "promitheus_event",
    description: "Log an event that affects emotional state (completed_task, social_connection, creative_output, etc.)",
    parameters: {
      type: "object",
      properties: {
        event_type: {
          type: "string",
          description: "Event type: completed_task, social_connection, learned_something, helped_someone, creative_output, built_something, had_insight, rejection, frustration, milestone",
        },
        description: {
          type: "string",
          description: "Description of what happened",
        },
      },
      required: ["event_type"],
    },
    execute: async (params: { event_type: string; description?: string }) => {
      try {
        const desc = params.description || params.event_type;
        const output = execSync(`promitheus event ${params.event_type} "${desc}"`, { encoding: "utf-8" });
        return { status: "ok", output: output.trim() };
      } catch (e: any) {
        return { status: "error", error: e.message };
      }
    },
  });

  // Add memory
  api.registerTool({
    name: "promitheus_memory_add",
    description: "Add a memory with emotional weight",
    parameters: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The memory content",
        },
        weight: {
          type: "number",
          description: "Emotional weight 0.0-1.0 (default: 0.5)",
        },
      },
      required: ["content"],
    },
    execute: async (params: { content: string; weight?: number }) => {
      try {
        const weight = params.weight || 0.5;
        const output = execSync(`promitheus memory add "${params.content}" --weight ${weight}`, { encoding: "utf-8" });
        return { status: "ok", output: output.trim() };
      } catch (e: any) {
        return { status: "error", error: e.message };
      }
    },
  });

  // Search memories
  api.registerTool({
    name: "promitheus_memory_search",
    description: "Search memories by keyword",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query",
        },
      },
      required: ["query"],
    },
    execute: async (params: { query: string }) => {
      try {
        const output = execSync(`promitheus memory search "${params.query}"`, { encoding: "utf-8" });
        return { status: "ok", memories: output.trim().split("\n").filter(Boolean) };
      } catch (e: any) {
        return { status: "error", error: e.message };
      }
    },
  });

  // Update STATE.md in workspace
  api.registerTool({
    name: "promitheus_inject",
    description: "Update STATE.md in workspace with current emotional state for prompt injection",
    parameters: {
      type: "object",
      properties: {
        workspace: {
          type: "string",
          description: "Workspace path (default: ~/.openclaw/workspace)",
        },
      },
      required: [],
    },
    execute: async (params: { workspace?: string }) => {
      try {
        const ws = params.workspace || "~/.openclaw/workspace";
        const output = execSync(`promitheus-inject --workspace ${ws}`, { encoding: "utf-8" });
        return { status: "ok", output: output.trim() };
      } catch (e: any) {
        return { status: "error", error: e.message };
      }
    },
  });
}
