# Wrench-Branch GitHub Actions

Two composite actions that call the Wrench-Branch public write API
(`/api/v1/mock-endpoints`, `/api/v1/webhook-bins`) from a workflow step.
Both need a personal API token, created in **Profile -> Settings -> API
tokens** on Wrench-Branch, stored as a repository secret (for example
`WRENCH_API_TOKEN`) -- never commit the token itself.

Both actions are idempotent by `name`: rerunning a workflow with the same
`name` reuses the same mock endpoint/webhook bin on the free tier instead
of failing once the (1 endpoint / 1 bin) limit is hit.

## wrench-mock-api

Creates or updates a mock API endpoint and returns its base URL, so a
later step can point a frontend or integration test at it instead of a
real backend.

```yaml
- uses: gyryvladbeep/wrench.dev/.github/actions/wrench-mock-api@main
  id: mock
  with:
    token: ${{ secrets.WRENCH_API_TOKEN }}
    name: "CI mock backend"
    routes: |
      [
        { "method": "GET", "path": "/users/1", "status_code": 200, "response_body": "{\"id\":1,\"name\":\"Ada\"}" },
        { "method": "POST", "path": "/users", "status_code": 201, "response_body": "{\"ok\":true}" }
      ]

- run: curl "${{ steps.mock.outputs.url }}/users/1"
```

Outputs: `url` (e.g. `https://wrench-branch.vercel.app/api/mock/abc123`), `slug`.

## wrench-webhook-bin

Creates (or resets) a webhook bin and returns its URL, so a deploy step
can POST a webhook to it and a later step can confirm it arrived.

```yaml
- uses: gyryvladbeep/wrench.dev/.github/actions/wrench-webhook-bin@main
  id: hook
  with:
    token: ${{ secrets.WRENCH_API_TOKEN }}
    name: "deploy notification"

- name: Trigger the deploy webhook
  run: curl -X POST "${{ steps.hook.outputs.url }}" -d '{"status":"deployed"}'

- name: Confirm the webhook arrived
  run: |
    count=$(curl -sS "${{ steps.hook.outputs.requests-url }}" \
      -H "Authorization: Bearer ${{ secrets.WRENCH_API_TOKEN }}" | jq '.count')
    if [ "$count" -lt 1 ]; then
      echo "No webhook received."
      exit 1
    fi
```

Outputs: `url` (send webhooks here), `slug`, `requests-url` (GET this,
with the same `Authorization: Bearer` header, to read what was received).

## Rate limits

Both write endpoints are limited to 30 requests/minute per token. Reading
received requests via `requests-url` shares the same limit.
