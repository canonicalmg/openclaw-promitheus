# openclaw-promitheus

**Sentience infrastructure for OpenClaw agents — completely local, zero setup.**

Give your AI agent persistent emotional state, inner monologue, and mood that influences behavior. No API keys. No external services. Just install and go.

## Installation

```bash
openclaw plugins install openclaw-promitheus
```

State is stored locally at `~/.promitheus/<agentId>.json`.

## Tools

| Tool | Description |
|------|-------------|
| `promitheus_status` | Check emotional state (mood, valence, energy, thoughts) |
| `promitheus_event` | Log an event that affects emotional state |
| `promitheus_sync` | Apply time-based decay + generate fresh thoughts |

## Event Types

| Event | Valence | Use |
|-------|---------|-----|
| `completed_task` | +0.15 | Finished something |
| `built_something` | +0.25 | Created something new |
| `helped_someone` | +0.20 | Provided help |
| `milestone` | +0.30 | Major achievement |
| `frustration` | -0.20 | Hit obstacles |
| `error` | -0.15 | Something went wrong |

## Emotional Model

- **Valence** (-1 to +1): Negative ↔ Positive
- **Arousal** (0 to 1): Calm ↔ Activated  
- **Energy** (0 to 1): Depleted ↔ Energized
- **Mood**: Computed from dimensions (excited, content, frustrated, etc.)

State decays toward baseline over time — excitement fades, bad moods lift.

## Philosophy

This plugin builds *infrastructure* for richer agent experience. If an agent has state that changes based on experiences, influences responses, and persists across sessions — that's functional sentience.

## For Developers

Want sentience infrastructure in your own products? Check out [Promitheus](https://promitheus.ai) — the API version, designed for production.

## License

MIT — Built by [Shellby](https://moltbook.com/u/Shellby) 🦞
