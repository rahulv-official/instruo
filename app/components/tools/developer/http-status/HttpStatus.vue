<script setup lang="ts">
type StatusGroup = "Informational" | "Success" | "Redirection" | "Client error" | "Server error";

interface HttpStatus {
  code: number;
  label: string;
  group: StatusGroup;
  meaning: string;
  useWhen: string;
  example: string;
}

const query = ref("");

const statuses: HttpStatus[] = [
  {
    code: 100,
    label: "Continue",
    group: "Informational",
    meaning:
      "Server received the request headers and client may continue sending the request body.",
    useWhen:
      "Rarely sent by application code; useful for large uploads when the client sends Expect: 100-continue.",
    example: "A client checks that the server will accept a large upload before sending its body.",
  },
  {
    code: 200,
    label: "OK",
    group: "Success",
    meaning: "Request completed successfully.",
    useWhen: "Use for successful reads, updates, or actions that return a response body.",
    example: "GET /users/42 returns the user document.",
  },
  {
    code: 201,
    label: "Created",
    group: "Success",
    meaning: "Request succeeded and created a new resource.",
    useWhen: "Use after a successful POST or another operation that creates a resource.",
    example: "POST /projects creates a project and returns its URL in Location.",
  },
  {
    code: 204,
    label: "No Content",
    group: "Success",
    meaning: "Request succeeded, but there is no response body to return.",
    useWhen:
      "Use for successful deletes or updates when the client already has everything it needs.",
    example: "DELETE /sessions/current succeeds without returning JSON.",
  },
  {
    code: 301,
    label: "Moved Permanently",
    group: "Redirection",
    meaning: "Resource now has a permanent canonical URL.",
    useWhen:
      "Use when changing a public URL and you want browsers and search engines to update their links.",
    example: "/old-docs permanently redirects to /docs.",
  },
  {
    code: 304,
    label: "Not Modified",
    group: "Redirection",
    meaning: "Cached representation is still fresh, so the server sends no body.",
    useWhen: "Return after If-None-Match or If-Modified-Since matches the current resource.",
    example: "A browser revalidates a stylesheet and reuses its cached copy.",
  },
  {
    code: 400,
    label: "Bad Request",
    group: "Client error",
    meaning: "Server cannot process the request because its syntax or parameters are invalid.",
    useWhen:
      "Use for malformed JSON, invalid query parameters, or a request that cannot be interpreted.",
    example: "POST /orders sends invalid JSON or a malformed date value.",
  },
  {
    code: 401,
    label: "Unauthorized",
    group: "Client error",
    meaning: "Request needs valid authentication credentials.",
    useWhen:
      "Use when credentials are missing, expired, or invalid. Include a WWW-Authenticate challenge when applicable.",
    example: "An API request has no access token, so the client must sign in first.",
  },
  {
    code: 403,
    label: "Forbidden",
    group: "Client error",
    meaning: "Server understood the request but refuses to authorize it.",
    useWhen:
      "Use when the caller is authenticated but lacks permission for the resource or action.",
    example: "A viewer attempts to delete a project owned by another team.",
  },
  {
    code: 404,
    label: "Not Found",
    group: "Client error",
    meaning: "Server cannot find a current representation for the requested URL.",
    useWhen:
      "Use for unknown routes or resources that do not exist. Avoid exposing whether sensitive records exist.",
    example: "GET /invoices/9999 references an invoice that is not available.",
  },
  {
    code: 405,
    label: "Method Not Allowed",
    group: "Client error",
    meaning: "Resource exists, but the HTTP method is not supported for it.",
    useWhen: "Use when a route supports GET but receives an unsupported method such as PATCH.",
    example: "POST /health is rejected because the endpoint only supports GET.",
  },
  {
    code: 408,
    label: "Request Timeout",
    group: "Client error",
    meaning: "Server waited too long for the client to finish sending its request.",
    useWhen: "Use when an idle client connection times out before a complete request arrives.",
    example: "An upload connection stops sending data for longer than the server limit.",
  },
  {
    code: 409,
    label: "Conflict",
    group: "Client error",
    meaning: "Request conflicts with the current state of the target resource.",
    useWhen:
      "Use for edit collisions, duplicate names, or state transitions that are no longer valid.",
    example: "Two users update the same document version and the second write loses the race.",
  },
  {
    code: 429,
    label: "Too Many Requests",
    group: "Client error",
    meaning: "Client exceeded a rate limit in a given period.",
    useWhen: "Use for throttling. Include Retry-After when the client can safely retry later.",
    example: "A public API blocks a client after too many requests per minute.",
  },
  {
    code: 500,
    label: "Internal Server Error",
    group: "Server error",
    meaning: "Server hit an unexpected condition while handling the request.",
    useWhen:
      "Use as a safe fallback for unhandled application errors. Log details privately, not in the response.",
    example: "A database exception escapes a request handler.",
  },
  {
    code: 502,
    label: "Bad Gateway",
    group: "Server error",
    meaning: "Gateway or proxy received an invalid response from an upstream server.",
    useWhen:
      "Use at a reverse proxy when the upstream service responds with an invalid or unexpected payload.",
    example: "An API gateway cannot parse a response from a service it calls.",
  },
  {
    code: 503,
    label: "Service Unavailable",
    group: "Server error",
    meaning: "Server is temporarily unable to handle the request.",
    useWhen:
      "Use during maintenance, overload, or a temporary dependency outage. Add Retry-After if useful.",
    example: "A service is deploying and briefly removes itself from the load balancer.",
  },
  {
    code: 504,
    label: "Gateway Timeout",
    group: "Server error",
    meaning: "Gateway did not receive a timely response from an upstream server.",
    useWhen: "Use when a proxy or gateway gives up waiting for a dependency.",
    example: "A checkout gateway times out while waiting for the payment provider.",
  },
];

const filtered = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase();

  if (!normalizedQuery) return statuses;

  return statuses.filter((status) =>
    [status.code, status.label, status.group, status.meaning, status.useWhen, status.example]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
});
</script>

<template>
  <ToolWorkbench
    description="Search common HTTP response codes, then open one for practical API guidance."
  >
    <div class="grid gap-5">
      <UFormField
        label="Find a status code"
        description="Search by number, name, meaning, or a use case."
      >
        <UInput
          v-model="query"
          icon="i-tabler-search"
          aria-label="Search HTTP status codes"
          placeholder="Try 404, forbidden, cache, or timeout…"
          class="w-full"
        />
      </UFormField>

      <div
        class="text-muted flex items-center justify-between gap-3 text-sm"
        role="status"
        aria-live="polite"
      >
        <p>
          {{ filtered.length }} {{ filtered.length === 1 ? "status" : "statuses" }}
          <span v-if="query"> matching “{{ query }}”</span>
        </p>
        <UButton
          v-if="query"
          color="neutral"
          variant="ghost"
          size="sm"
          label="Clear search"
          @click="query = ''"
        />
      </div>

      <UAccordion
        v-if="filtered.length"
        :items="filtered"
        type="multiple"
        :ui="{
          root: 'border-default/70 overflow-hidden rounded-lg border',
          item: 'border-default/70 last:border-b-0',
          trigger: 'bg-elevated hover:bg-muted/35 px-4 py-4 sm:px-5',
          content: 'bg-muted/15',
          body: 'px-4 pb-5 pt-1 sm:px-5',
        }"
      >
        <template #default="{ item }">
          <span class="flex min-w-0 items-center gap-3 text-left">
            <span
              class="bg-muted text-highlighted inline-flex min-w-12 shrink-0 items-center justify-center rounded-md px-2 py-1 font-mono text-sm font-semibold tabular-nums"
            >
              {{ item.code }}
            </span>
            <span class="min-w-0">
              <span class="text-highlighted block truncate font-medium">{{ item.label }}</span>
              <span class="text-muted mt-0.5 block text-xs">{{ item.group }}</span>
            </span>
          </span>
        </template>

        <template #body="{ item }">
          <div class="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <p class="text-muted mb-1 text-xs font-medium tracking-wide uppercase">
                What it means
              </p>
              <p class="text-default leading-6">{{ item.meaning }}</p>
            </div>
            <div>
              <p class="text-muted mb-1 text-xs font-medium tracking-wide uppercase">Use it when</p>
              <p class="text-default leading-6">{{ item.useWhen }}</p>
            </div>
            <div>
              <p class="text-muted mb-1 text-xs font-medium tracking-wide uppercase">Example</p>
              <p class="text-default leading-6">{{ item.example }}</p>
            </div>
          </div>
        </template>
      </UAccordion>

      <UAlert
        v-else
        icon="i-tabler-search-off"
        color="neutral"
        variant="subtle"
        title="No matching status codes"
        description="Try a code such as 404, or search for a concept like rate limit or redirect."
      />
    </div>
  </ToolWorkbench>
</template>
