# Public OpenAPI freeze

Status: Frozen. No payout or funding worker implementation may begin until this file exists.

`docs/kita-plan/openapi/kita-v1.yaml` is the authoritative public HTTP wire contract, including methods, paths, request and response schemas, status codes, and authentication requirements.

Method/path names in `13-backlog` that disagree with that OpenAPI document are internal aliases only until a later reviewed addendum explicitly changes the public contract. Backlog wording does not authorize a new or renamed HTTP endpoint.

## Worker requirements

- Workers must use the methods, paths, and wire shapes defined in `docs/kita-plan/openapi/kita-v1.yaml` for public HTTP interactions.
- Workers must not invent private HTTP endpoints, routes, methods, request or response shapes, or undocumented HTTP contracts to implement backlog aliases or connect internal components.
- Internal backlog aliases may identify implementation tasks, jobs, or in-process operations; they do not define an HTTP interface.
- If an implementation requires an HTTP contract absent from or inconsistent with the frozen OpenAPI document, stop that dependent work and obtain a later reviewed addendum before implementing it.
- Payout and funding workers are subject to this freeze before implementation begins.
