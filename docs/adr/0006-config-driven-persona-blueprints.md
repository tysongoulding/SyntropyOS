# 6. Config-Driven Persona Blueprints

## Context
Compiling every domain persona as a Rust struct requires rebuilding the engine whenever a new agent skill or role directive is added or tuned.

## Decision
The core execution engine remains generic Rust, while agent personas are defined as declarative YAML/JSON blueprints specifying system directives, deliverable contracts, and permitted native tool IDs. These load dynamically into the Rules and Customise registry.

## Consequences
Domain skills from the agency library can be added, updated, or customized at runtime without touching Rust source code.
