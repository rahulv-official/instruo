<script setup lang="ts">
import { parse as parseYamlDocument } from "yaml";

interface OpenApiObject {
  [key: string]: unknown;
}

interface Endpoint {
  path: string;
  method: string;
  operation: OpenApiObject;
}

const httpMethods = ["get", "post", "put", "patch", "delete", "options", "head", "trace"];
const operationFields = ["callbacks", "security", "servers", "externalDocs"];
const example = {
  openapi: "3.0.3",
  info: {
    title: "Example API",
    version: "1.0.0",
    description: "A small API showing request bodies, parameters, and responses.",
  },
  servers: [{ url: "https://api.example.com/v1", description: "Production" }],
  paths: {
    "/users": {
      get: {
        summary: "List users",
        operationId: "listUsers",
        parameters: [{ name: "limit", in: "query", schema: { type: "integer", default: 20 } }],
        responses: {
          "200": {
            description: "A page of users",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/User" } },
              },
            },
          },
        },
      },
      post: {
        summary: "Create user",
        operationId: "createUser",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UserInput" } } },
        },
        responses: {
          "201": {
            description: "Created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: "object",
        required: ["id", "name"],
        properties: { id: { type: "string" }, name: { type: "string" } },
      },
      UserInput: { type: "object", required: ["name"], properties: { name: { type: "string" } } },
    },
  },
};

const input = ref(JSON.stringify(example, null, 2));
const document = shallowRef<OpenApiObject | null>(null);
const error = ref("");
const { copyText } = useCopyToClipboard();

function isObject(value: unknown): value is OpenApiObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function objectEntries(value: unknown): [string, unknown][] {
  return isObject(value) ? Object.entries(value) : [];
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2) ?? "—";
}

function operationValue(operation: OpenApiObject, field: string) {
  return operation[field];
}

const info = computed(() => (isObject(document.value?.info) ? document.value.info : {}));
const title = computed(() => String(info.value.title ?? "Untitled API"));
const version = computed(() =>
  String(document.value?.openapi ?? document.value?.swagger ?? "Unknown"),
);
const description = computed(() => String(info.value.description ?? ""));
const servers = computed(() =>
  Array.isArray(document.value?.servers) ? document.value.servers : [],
);
const tags = computed(() => (Array.isArray(document.value?.tags) ? document.value.tags : []));
const endpoints = computed<Endpoint[]>(() => {
  const paths = isObject(document.value?.paths) ? document.value.paths : {};
  return Object.entries(paths).flatMap(([path, pathItem]) =>
    objectEntries(pathItem)
      .filter(
        ([method, operation]) => httpMethods.includes(method.toLowerCase()) && isObject(operation),
      )
      .map(([method, operation]) => ({
        path,
        method: method.toUpperCase(),
        operation: operation as OpenApiObject,
      })),
  );
});
const componentGroups = computed(() => {
  const components = isObject(document.value?.components) ? document.value.components : {};
  return Object.entries(components)
    .filter(([, value]) => isObject(value) && Object.keys(value).length > 0)
    .map(([name, value]) => ({ name, entries: Object.entries(value as OpenApiObject) }));
});
const securitySchemes = computed(() => {
  const schemes =
    isObject(document.value?.components) && isObject(document.value.components.securitySchemes)
      ? document.value.components.securitySchemes
      : {};
  return Object.entries(schemes);
});

function inspect() {
  error.value = "";
  try {
    const parsed: unknown = input.value.trim().startsWith("{")
      ? JSON.parse(input.value)
      : parseYamlDocument(input.value);
    if (!isObject(parsed))
      throw new Error("The document must contain an OpenAPI object at its root.");
    if (!parsed.openapi && !parsed.swagger)
      throw new Error("Add an openapi or swagger version field.");
    document.value = parsed;
  } catch (cause) {
    document.value = null;
    error.value = cause instanceof Error ? cause.message : "Could not parse this OpenAPI document.";
  }
}

function loadExample() {
  input.value = JSON.stringify(example, null, 2);
  inspect();
}

inspect();
</script>

<template>
  <ToolWorkbench
    description="Explore every part of an OpenAPI document locally: operations, schemas, parameters, responses, and raw data."
  >
    <div class="grid gap-5">
      <UFormField label="OpenAPI JSON or YAML">
        <UTextarea
          v-model="input"
          :rows="16"
          class="w-full font-mono"
        />
      </UFormField>
      <div class="flex flex-wrap gap-2">
        <UButton
          label="Inspect document"
          icon="i-tabler-scan"
          @click="inspect"
        />
        <UButton
          label="Load complete example"
          color="neutral"
          variant="outline"
          @click="loadExample"
        />
        <UButton
          color="neutral"
          variant="soft"
          label="Copy source"
          icon="i-tabler-copy"
          @click="copyText(input)"
        />
      </div>
      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        icon="i-tabler-alert-circle"
        title="Invalid OpenAPI document"
        :description="error"
      />

      <template v-if="document">
        <div class="border-default bg-elevated grid gap-5 rounded-lg border p-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 class="text-highlighted text-xl font-semibold">{{ title }}</h3>
              <p class="text-muted mt-1 text-sm">OpenAPI {{ version }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <UBadge
                :label="`${endpoints.length} operations`"
                color="primary"
                variant="subtle"
              />
              <UBadge
                v-if="componentGroups.length"
                :label="`${componentGroups.reduce((count, group) => count + group.entries.length, 0)} reusable components`"
                color="neutral"
                variant="subtle"
              />
            </div>
          </div>
          <p
            v-if="description"
            class="text-muted max-w-3xl text-sm leading-6"
          >
            {{ description }}
          </p>
          <div
            v-if="info.contact || info.license"
            class="border-default grid gap-3 border-t pt-4 sm:grid-cols-2"
          >
            <div v-if="info.contact">
              <p class="text-muted text-xs font-medium tracking-wide uppercase">Contact</p>
              <pre class="text-highlighted mt-1 text-sm whitespace-pre-wrap">{{
                formatJson(info.contact)
              }}</pre>
            </div>
            <div v-if="info.license">
              <p class="text-muted text-xs font-medium tracking-wide uppercase">License</p>
              <pre class="text-highlighted mt-1 text-sm whitespace-pre-wrap">{{
                formatJson(info.license)
              }}</pre>
            </div>
          </div>
        </div>

        <section
          v-if="servers.length || tags.length || securitySchemes.length"
          class="grid gap-3"
        >
          <h3 class="text-highlighted text-lg font-semibold">API context</h3>
          <div class="grid gap-3 lg:grid-cols-3">
            <div
              v-if="servers.length"
              class="border-default rounded-lg border p-4"
            >
              <p class="text-muted mb-3 text-sm font-medium">Servers</p>
              <div
                v-for="(server, index) in servers"
                :key="index"
                class="border-default border-b py-2 last:border-0"
              >
                <code class="text-highlighted text-sm break-all">{{
                  isObject(server) ? server.url : server
                }}</code>
                <p
                  v-if="isObject(server) && server.description"
                  class="text-muted mt-1 text-xs"
                >
                  {{ server.description }}
                </p>
              </div>
            </div>
            <div
              v-if="tags.length"
              class="border-default rounded-lg border p-4"
            >
              <p class="text-muted mb-3 text-sm font-medium">Tags</p>
              <div
                v-for="(tag, index) in tags"
                :key="index"
                class="border-default border-b py-2 last:border-0"
              >
                <p class="text-highlighted text-sm">{{ isObject(tag) ? tag.name : tag }}</p>
                <p
                  v-if="isObject(tag) && tag.description"
                  class="text-muted mt-1 text-xs"
                >
                  {{ tag.description }}
                </p>
              </div>
            </div>
            <div
              v-if="securitySchemes.length"
              class="border-default rounded-lg border p-4"
            >
              <p class="text-muted mb-3 text-sm font-medium">Security schemes</p>
              <div
                v-for="[name, scheme] in securitySchemes"
                :key="name"
                class="border-default border-b py-2 last:border-0"
              >
                <p class="text-highlighted text-sm">{{ name }}</p>
                <p class="text-muted mt-1 text-xs">
                  {{
                    isObject(scheme)
                      ? `${scheme.type ?? "scheme"}${scheme.scheme ? ` · ${scheme.scheme}` : ""}`
                      : ""
                  }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section class="grid gap-3">
          <div class="flex items-baseline justify-between gap-3">
            <h3 class="text-highlighted text-lg font-semibold">Operations</h3>
            <span class="text-muted text-sm">{{ endpoints.length }} total</span>
          </div>
          <div
            v-if="endpoints.length"
            class="grid gap-3"
          >
            <article
              v-for="endpoint in endpoints"
              :key="`${endpoint.method}-${endpoint.path}`"
              class="border-default rounded-lg border p-5"
            >
              <div class="flex flex-wrap items-center gap-3">
                <UBadge
                  :label="endpoint.method"
                  color="primary"
                  variant="subtle"
                /><code class="text-highlighted font-mono text-sm">{{ endpoint.path }}</code
                ><span
                  v-if="endpoint.operation.operationId"
                  class="text-muted text-xs"
                  >{{ endpoint.operation.operationId }}</span
                >
              </div>
              <h4
                v-if="endpoint.operation.summary"
                class="text-highlighted mt-4 font-medium"
              >
                {{ endpoint.operation.summary }}
              </h4>
              <p
                v-if="endpoint.operation.description"
                class="text-muted mt-2 text-sm leading-6"
              >
                {{ endpoint.operation.description }}
              </p>
              <div
                v-if="
                  endpoint.operation.tags ||
                  endpoint.operation.parameters ||
                  endpoint.operation.requestBody ||
                  endpoint.operation.responses
                "
                class="mt-4 grid gap-2"
              >
                <details
                  v-if="endpoint.operation.tags"
                  class="border-default rounded-md border px-4 py-3"
                >
                  <summary class="text-highlighted cursor-pointer text-sm font-medium">
                    Tags
                  </summary>
                  <p class="text-muted mt-3 text-sm">
                    {{ (endpoint.operation.tags as string[]).join(", ") }}
                  </p>
                </details>
                <details
                  v-if="endpoint.operation.parameters"
                  class="border-default rounded-md border px-4 py-3"
                >
                  <summary class="text-highlighted cursor-pointer text-sm font-medium">
                    Parameters ({{
                      Array.isArray(endpoint.operation.parameters)
                        ? endpoint.operation.parameters.length
                        : 0
                    }})
                  </summary>
                  <pre class="text-muted mt-3 overflow-auto text-xs whitespace-pre-wrap">{{
                    formatJson(endpoint.operation.parameters)
                  }}</pre>
                </details>
                <details
                  v-if="endpoint.operation.requestBody"
                  class="border-default rounded-md border px-4 py-3"
                >
                  <summary class="text-highlighted cursor-pointer text-sm font-medium">
                    Request body
                  </summary>
                  <pre class="text-muted mt-3 overflow-auto text-xs whitespace-pre-wrap">{{
                    formatJson(endpoint.operation.requestBody)
                  }}</pre>
                </details>
                <details
                  v-if="endpoint.operation.responses"
                  open
                  class="border-default rounded-md border px-4 py-3"
                >
                  <summary class="text-highlighted cursor-pointer text-sm font-medium">
                    Responses ({{ objectEntries(endpoint.operation.responses).length }})
                  </summary>
                  <div class="mt-3 grid gap-3">
                    <div
                      v-for="[status, response] in objectEntries(endpoint.operation.responses)"
                      :key="status"
                      class="border-default bg-elevated rounded-md border p-3"
                    >
                      <div class="flex items-center gap-2">
                        <UBadge
                          :label="status"
                          color="neutral"
                          variant="subtle"
                        /><span
                          v-if="isObject(response)"
                          class="text-muted text-sm"
                          >{{ response.description }}</span
                        >
                      </div>
                      <pre class="text-muted mt-2 overflow-auto text-xs whitespace-pre-wrap">{{
                        formatJson(response)
                      }}</pre>
                    </div>
                  </div>
                </details>
                <template
                  v-for="field in operationFields"
                  :key="field"
                >
                  <details
                    v-if="operationValue(endpoint.operation, field)"
                    class="border-default rounded-md border px-4 py-3"
                  >
                    <summary class="text-highlighted cursor-pointer text-sm font-medium">
                      {{ field }}
                    </summary>
                    <pre class="text-muted mt-3 overflow-auto text-xs whitespace-pre-wrap">{{
                      formatJson(operationValue(endpoint.operation, field))
                    }}</pre>
                  </details>
                </template>
              </div>
            </article>
          </div>
          <UAlert
            v-else
            color="neutral"
            variant="subtle"
            icon="i-tabler-route"
            title="No operations found"
            description="This document does not contain an HTTP paths object."
          />
        </section>

        <section
          v-if="componentGroups.length"
          class="grid gap-3"
        >
          <h3 class="text-highlighted text-lg font-semibold">Reusable components</h3>
          <div class="grid gap-3 lg:grid-cols-2">
            <details
              v-for="group in componentGroups"
              :key="group.name"
              class="border-default rounded-lg border p-4"
            >
              <summary class="text-highlighted cursor-pointer text-sm font-medium">
                {{ group.name }} <span class="text-muted">({{ group.entries.length }})</span>
              </summary>
              <div class="mt-3 grid gap-2">
                <details
                  v-for="[name, value] in group.entries"
                  :key="name"
                  class="border-default rounded-md border px-3 py-2"
                >
                  <summary class="text-highlighted cursor-pointer font-mono text-xs">
                    {{ name }}
                  </summary>
                  <pre class="text-muted mt-3 overflow-auto text-xs whitespace-pre-wrap">{{
                    formatJson(value)
                  }}</pre>
                </details>
              </div>
            </details>
          </div>
        </section>

        <details class="border-default rounded-lg border p-5">
          <summary class="text-highlighted cursor-pointer font-medium">Raw parsed document</summary>
          <pre
            class="text-muted mt-4 max-h-[32rem] overflow-auto text-xs leading-5 whitespace-pre-wrap"
            >{{ formatJson(document) }}</pre>
        </details>
      </template>
    </div>
  </ToolWorkbench>
</template>
