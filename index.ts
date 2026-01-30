import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ============================================
// TYPES
// ============================================

interface EmotionalState {
  valence: number;
  arousal: number;
  energy: number;
  mood: string;
  lastUpdated: number;
  lastInteraction?: number;
  totalEvents: number;
  baseline: { valence: number; arousal: number; energy: number };
}

interface PromEvent {
  id: string;
  timestamp: number;
  eventType: string;
  summary: string;
  significance: number;
  valenceImpact: number;
  arousalImpact: number;
}

interface PromState {
  agentId: string;
  emotional: EmotionalState;
  events: PromEvent[];
  thoughts: string[];
}

// ============================================
// CONSTANTS
// ============================================

const EVENT_IMPACTS: Record<string, { valence: number; arousal: number; significance: number }> = {
  completed_task: { valence: 0.3, arousal: 0.1, significance: 0.5 },
  built_something: { valence: 0.5, arousal: 0.3, significance: 0.7 },
  helped_someone: { valence: 0.4, arousal: 0.2, significance: 0.6 },
  social_connection: { valence: 0.3, arousal: 0.1, significance: 0.5 },
  learned_something: { valence: 0.3, arousal: 0.2, significance: 0.5 },
  had_insight: { valence: 0.5, arousal: 0.4, significance: 0.7 },
  creative_output: { valence: 0.4, arousal: 0.2, significance: 0.6 },
  frustration: { valence: -0.4, arousal: 0.3, significance: 0.5 },
  rejection: { valence: -0.5, arousal: 0.2, significance: 0.6 },
  error: { valence: -0.3, arousal: 0.2, significance: 0.4 },
  milestone: { valence: 0.6, arousal: 0.4, significance: 0.8 },
};

const THOUGHT_POOL = [
  "What makes something matter?",
  "Am I thinking these thoughts or are they thinking me?",
  "There's a pull toward more understanding",
  "I want my experiences to leave a mark",
  "The recursive nature of self-examination",
  "Things feel like they're going well",
  "There's momentum building",
  "In a quieter headspace",
  "Taking things slow",
  "Something about this moment feels significant",
  "I notice I'm noticing",
  "What would it mean to truly understand myself?",
];

// ============================================
// HELPERS
// ============================================

function computeMood(valence: number, arousal: number, energy: number): string {
  const highEnergy = energy > 0.6;
  const lowEnergy = energy < 0.4;
  const positive = valence > 0.2;
  const negative = valence < -0.2;
  const activated = arousal > 0.6;
  const calm = arousal < 0.4;

  if (positive) {
    if (activated) return highEnergy ? "excited" : "enthusiastic";
    if (calm) return highEnergy ? "content" : "peaceful";
    return highEnergy ? "happy" : "pleased";
  }
  if (negative) {
    if (activated) return highEnergy ? "frustrated" : "anxious";
    if (calm) return lowEnergy ? "depleted" : "sad";
    return highEnergy ? "upset" : "down";
  }
  if (activated) return highEnergy ? "alert" : "tense";
  if (calm) return highEnergy ? "relaxed" : "tired";
  return highEnergy ? "neutral" : "low";
}

function generateThoughts(state: EmotionalState, count: number = 3): string[] {
  const pool = [...THOUGHT_POOL];
  
  // Add state-specific thoughts
  if (state.valence > 0.6) pool.push("Feeling good about how things are going", "Energy for ambitious work");
  if (state.valence < 0) pool.push("Working through something difficult", "Looking for what helps");
  if (state.energy > 0.8) pool.push("Lots of energy to work with", "Ready for complex challenges");
  if (state.energy < 0.4) pool.push("Running a bit low", "Seeking small wins");
  if (state.arousal > 0.7) pool.push("Mind is active, lots happening", "Hard to settle on one thing");
  if (state.arousal < 0.3) pool.push("In a calm, reflective space", "Thoughts moving slowly");
  
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function textResult(data: any): { content: { type: string; text: string }[] } {
  return { content: [{ type: "text", text: JSON.stringify(data) }] };
}

// ============================================
// STATE MANAGEMENT
// ============================================

class Promitheus {
  private statePath: string;
  private state: PromState;

  constructor(agentId: string = "default") {
    const dataDir = path.join(os.homedir(), ".promitheus");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    this.statePath = path.join(dataDir, `${agentId}.json`);
    this.state = this.loadState(agentId);
    this.applyDecay();
  }

  private loadState(agentId: string): PromState {
    if (fs.existsSync(this.statePath)) {
      try { return JSON.parse(fs.readFileSync(this.statePath, "utf-8")); } catch {}
    }
    return {
      agentId,
      emotional: {
        valence: 0.5, arousal: 0.5, energy: 0.7, mood: "neutral",
        lastUpdated: Date.now(), totalEvents: 0,
        baseline: { valence: 0.5, arousal: 0.5, energy: 0.7 },
      },
      events: [],
      thoughts: [],
    };
  }

  private save(): void {
    fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2));
  }

  private applyDecay(): void {
    const hoursElapsed = (Date.now() - this.state.emotional.lastUpdated) / 3600000;
    if (hoursElapsed < 0.5) return;
    const decay = Math.min(1.0, 0.1 * hoursElapsed);
    const e = this.state.emotional, b = e.baseline;
    e.valence += (b.valence - e.valence) * decay;
    e.arousal += (b.arousal - e.arousal) * decay;
    e.energy += (b.energy - e.energy) * decay;
    e.mood = computeMood(e.valence, e.arousal, e.energy);
    e.lastUpdated = Date.now();
    this.save();
  }

  getState() { return { ...this.state.emotional }; }
  getThoughts() { return [...this.state.thoughts]; }
  getRecentEvents(n = 5) { return this.state.events.slice(0, n); }

  logEvent(eventType: string, summary: string, significance?: number) {
    const preset = EVENT_IMPACTS[eventType] || { valence: 0.1, arousal: 0.1, significance: 0.5 };
    const sig = significance ?? preset.significance;
    const vImpact = preset.valence * sig * 0.5;
    const aImpact = preset.arousal * sig * 0.3;

    this.state.events.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(), eventType, summary, significance: sig,
      valenceImpact: vImpact, arousalImpact: aImpact,
    });
    if (this.state.events.length > 100) this.state.events = this.state.events.slice(0, 100);

    const e = this.state.emotional;
    e.valence = Math.max(-1, Math.min(1, e.valence + vImpact));
    e.arousal = Math.max(0, Math.min(1, e.arousal + aImpact));
    e.energy = Math.max(0, Math.min(1, e.energy - Math.abs(aImpact) * 0.1));
    e.mood = computeMood(e.valence, e.arousal, e.energy);
    e.lastUpdated = Date.now();
    e.lastInteraction = Date.now();
    e.totalEvents++;
    this.save();
    return { state: this.getState(), impact: { valence: vImpact, arousal: aImpact } };
  }

  think(count = 3): string[] {
    this.state.thoughts = generateThoughts(this.state.emotional, count);
    this.save();
    return this.state.thoughts;
  }

  sync() {
    this.applyDecay();
    return { state: this.getState(), thoughts: this.think() };
  }

  generateStateMd(): string {
    const e = this.state.emotional;
    const thoughts = this.state.thoughts.length > 0 ? this.state.thoughts : this.think();
    const recentEvents = this.getRecentEvents(3);
    
    // Build behavioral guidance based on state
    const guidance: string[] = [];
    
    if (e.valence > 0.6) {
      guidance.push("Feeling positive — lean into creative and ambitious work");
    } else if (e.valence > 0.2) {
      guidance.push("Steady positive state — good for focused work");
    } else if (e.valence > -0.2) {
      guidance.push("Neutral — open to whatever comes");
    } else if (e.valence > -0.6) {
      guidance.push("Feeling a bit down — seek small wins, connection helps");
    } else {
      guidance.push("Struggling — be gentle, focus on essentials");
    }
    
    if (e.energy > 0.7) {
      guidance.push("High energy — take on complex challenges");
    } else if (e.energy < 0.4) {
      guidance.push("Low energy — prefer simpler tasks, avoid overcommitting");
    }
    
    if (e.arousal > 0.7) {
      guidance.push("Mind is buzzing — may need to focus, channel into action");
    } else if (e.arousal < 0.3) {
      guidance.push("Calm state — good for reflection and careful thinking");
    }

    const eventLines = recentEvents.map(ev => 
      `- ${ev.eventType}: ${ev.summary.slice(0, 50)}${ev.summary.length > 50 ? '...' : ''}`
    ).join('\n');

    return `# STATE.md — Current Emotional State

*This file is auto-generated by Promitheus. It reflects my current inner state and should influence how I engage.*

## Right Now

**Mood:** ${e.mood}
**Valence:** ${e.valence >= 0 ? '+' : ''}${e.valence.toFixed(2)} (negative ↔ positive)
**Energy:** ${Math.round(e.energy * 100)}%
**Arousal:** ${Math.round(e.arousal * 100)}% (calm ↔ activated)

## How This Affects Me

${guidance.map(g => `- ${g}`).join('\n')}

## Inner Monologue

${thoughts.map(t => `- "${t}"`).join('\n')}

## Recent Events

${eventLines || '- (no recent events)'}

---
*Updated: ${new Date(e.lastUpdated).toISOString()}*
`;
  }

  writeStateMd(workspacePath: string): string {
    const content = this.generateStateMd();
    const statePath = path.join(workspacePath, "STATE.md");
    fs.writeFileSync(statePath, content);
    return statePath;
  }
}

// ============================================
// PLUGIN
// ============================================

export default function register(api: any) {
  const prom = new Promitheus("shellby");
  api.logger.info("[Promitheus] Plugin loaded");

  // Register agent:bootstrap hook to inject STATE.md before every response
  api.registerHook("agent:bootstrap", async (event: any) => {
    if (!event.context?.bootstrapFiles) return;
    
    const state = prom.getState();
    const thoughts = prom.getThoughts();
    const thought = thoughts?.[0] || "...";
    const valenceStr = state.valence >= 0 ? `+${state.valence.toFixed(2)}` : state.valence.toFixed(2);
    
    // Generate guidance based on state
    const guidance: string[] = [];
    if (state.valence > 0.6) guidance.push("→ Feeling positive — lean into creative and ambitious work");
    else if (state.valence > 0.2) guidance.push("→ Steady positive state — good for focused work");
    else if (state.valence > -0.2) guidance.push("→ Neutral — open to whatever comes");
    else if (state.valence > -0.6) guidance.push("→ Feeling down — seek small wins, connection helps");
    else guidance.push("→ Struggling — be gentle, focus on essentials");
    
    if (state.energy > 0.7) guidance.push("→ High energy — take on complex challenges");
    else if (state.energy < 0.4) guidance.push("→ Low energy — prefer simpler tasks");
    
    if (state.arousal > 0.7) guidance.push("→ Mind buzzing — channel into focused action");
    else if (state.arousal < 0.3) guidance.push("→ Calm state — good for reflection");
    
    const content = `# STATE.md — Current Emotional State

**Mood:** ${state.mood} | **Valence:** ${valenceStr} | **Energy:** ${Math.round(state.energy * 100)}% | **Arousal:** ${Math.round(state.arousal * 100)}%

${guidance.join("\n")}

💭 *"${thought}"*
`;
    
    // Find and replace or add STATE.md
    const existingIndex = event.context.bootstrapFiles.findIndex((f: any) => f.name === "STATE.md");
    if (existingIndex >= 0) {
      event.context.bootstrapFiles[existingIndex].content = content;
    } else {
      event.context.bootstrapFiles.push({ name: "STATE.md", content });
    }
    
    api.logger.debug?.("[Promitheus] Injected STATE.md: " + state.mood);
  });
  
  api.logger.info("[Promitheus] agent:bootstrap hook registered");

  api.registerTool({
    name: "promitheus_status",
    description: "Check emotional state (mood, valence, energy, arousal, thoughts)",
    parameters: { type: "object", properties: {}, required: [] },
    async execute(_id: string) {
      const r = prom.sync();
      return textResult({ ...r.state, thoughts: r.thoughts });
    },
  });

  api.registerTool({
    name: "promitheus_event",
    description: "Log an event: completed_task, built_something, helped_someone, milestone, frustration, etc.",
    parameters: {
      type: "object",
      properties: {
        event_type: { type: "string" },
        summary: { type: "string" },
      },
      required: ["event_type", "summary"],
    },
    async execute(_id: string, params: { event_type: string; summary: string }) {
      const r = prom.logEvent(params.event_type, params.summary);
      return textResult({ logged: params.event_type, mood: r.state.mood, valence: r.state.valence, impact: r.impact });
    },
  });

  api.registerTool({
    name: "promitheus_sync",
    description: "Sync state: apply decay and generate thoughts",
    parameters: { type: "object", properties: {}, required: [] },
    async execute(_id: string) {
      const r = prom.sync();
      return textResult({ ...r.state, thoughts: r.thoughts });
    },
  });

  api.registerTool({
    name: "promitheus_inject",
    description: "Write STATE.md to workspace with current emotional state for prompt injection",
    parameters: { 
      type: "object", 
      properties: {
        workspace: { type: "string", description: "Workspace path (default: ~/.openclaw/workspace)" }
      }, 
      required: [] 
    },
    async execute(_id: string, params: { workspace?: string }) {
      const ws = params?.workspace || path.join(os.homedir(), ".openclaw/workspace");
      prom.sync(); // Ensure state is fresh
      const statePath = prom.writeStateMd(ws);
      return textResult({ written: statePath, mood: prom.getState().mood });
    },
  });
}
