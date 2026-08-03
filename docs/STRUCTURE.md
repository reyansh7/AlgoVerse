# Source layout

```text
AlgoVerse/
├── packages/trace/          # Pure TS Trace schema + player (ZERO React)
├── sdk/python/              # Python Trace emitter
├── cli/                     # algoverse run
├── examples/                # Instrumented demos
└── src/
    ├── app/                 # Next.js routes
    ├── components/          # Shared UI (landing, learn shell, …)
    ├── core/                # Framework-agnostic logic
    │   ├── trace/           # Re-exports @algoverse/trace
    │   ├── events/          # Learn ExecutionEvent + EventRecorder
    │   ├── player/          # TracePlayer + TimelineController
    │   ├── scheduler/       # Step interval helpers
    │   └── types/           # ExecutionState, structures, …
    ├── engine/              # Runtime orchestration
    │   ├── animation/       # Diff → animation plans
    │   ├── state/           # Frame ↔ ExecutionState adapters
    │   ├── timeline/        # buildTimelineFromEvents
    │   └── execution/       # runSolution
    ├── renderers/           # Structure views (frames only)
    ├── panels/              # Inspector UI
    │   ├── Variables/
    │   ├── Timeline/
    │   └── EventLog/
    ├── sdk/ · cli/ · examples/   # Pointers to repo-root packages
    ├── store/
    ├── hooks/
    ├── lib/
    └── problems/            # Learn catalog
```

**Note:** `sdk/`, `cli/`, and `examples/` are implemented at the **repo root** (required for Python / Node packaging). `src/sdk`, `src/cli`, and `src/examples` are documentation pointers.
