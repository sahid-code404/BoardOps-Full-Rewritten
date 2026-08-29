# BoardOps API Contract Foundation

Canonical API prefix: `/api/v1/`.

`packages/api-contract/openapi/boardops-v1.yaml` is the initial OpenAPI 3.1 source. Phase 01 contains only foundation endpoints. Future routes must update the contract and contract tests in the same change.

Errors use `{ "error": { "code", "message", "requestId", "details?" } }`. Raw SQL/runtime internals must never cross the API boundary.

Compatibility matters because old mobile binaries may remain installed while the backend evolves. Breaking changes require a version/deprecation plan rather than silently changing v1 semantics.
