<script setup lang="ts">
type ExportFormat = "curl" | "fetch" | "axios" | "httpie";

const method = ref("GET");
const url = ref("https://api.example.com/users");
const query = ref("page=1\nlimit=20");
const headers = ref("Accept: application/json");
const body = ref("");
const format = ref<ExportFormat>("curl");
const { copyText } = useCopyToClipboard();

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const formats = [
  { label: "cURL", value: "curl" },
  { label: "Fetch", value: "fetch" },
  { label: "Axios", value: "axios" },
  { label: "HTTPie", value: "httpie" },
];

function entries(value: string, separator: string): [string, string][] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const index = line.indexOf(separator);
      return index < 0
        ? ([line, ""] as [string, string])
        : ([line.slice(0, index).trim(), line.slice(index + 1).trim()] as [string, string]);
    });
}

const requestUrl = computed(() => {
  try {
    const parsed = new URL(url.value || "https://example.com");
    for (const [key, value] of entries(query.value, "=")) {
      if (key) parsed.searchParams.set(key, value);
    }
    return parsed.toString();
  } catch {
    return url.value;
  }
});

const headerEntries = computed(() => entries(headers.value, ":").filter(([key]) => key));
function quote(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

const command = computed(() => {
  const headerFlags = headerEntries.value
    .map(([key, value]) => `-H ${quote(`${key}: ${value}`)}`)
    .join(" ");
  const data =
    body.value.trim() && method.value !== "GET" ? ` --data ${quote(body.value.trim())}` : "";
  return `curl -X ${method.value} ${quote(requestUrl.value)}${headerFlags ? ` ${headerFlags}` : ""}${data}`;
});

const fetchCode = computed(() => {
  const headerObject = Object.fromEntries(headerEntries.value);
  const options = [
    `  method: ${JSON.stringify(method.value)}`,
    `  headers: ${JSON.stringify(headerObject, null, 2).replace(/\n/g, "\n  ")}`,
  ];
  if (body.value.trim() && method.value !== "GET")
    options.push(`  body: ${JSON.stringify(body.value.trim())}`);
  return `fetch(${JSON.stringify(requestUrl.value)}, {\n${options.join(",\n")}\n});`;
});

const axiosCode = computed(() => {
  const config = [
    `  method: ${JSON.stringify(method.value.toLowerCase())}`,
    `  url: ${JSON.stringify(requestUrl.value)}`,
  ];
  if (headerEntries.value.length)
    config.push(
      `  headers: ${JSON.stringify(Object.fromEntries(headerEntries.value), null, 2).replace(/\n/g, "\n  ")}`,
    );
  if (body.value.trim() && method.value !== "GET")
    config.push(`  data: ${JSON.stringify(body.value.trim())}`);
  return `axios.request({\n${config.join(",\n")}\n});`;
});

const httpieCode = computed(() => {
  const headerFlags = headerEntries.value.map(([key, value]) => `${key}:${quote(value)}`).join(" ");
  const data =
    body.value.trim() && method.value !== "GET" ? ` --raw=${quote(body.value.trim())}` : "";
  return `http ${method.value} ${quote(requestUrl.value)}${headerFlags ? ` ${headerFlags}` : ""}${data}`;
});

const output = computed(
  () =>
    ({
      curl: command.value,
      fetch: fetchCode.value,
      axios: axiosCode.value,
      httpie: httpieCode.value,
    })[format.value],
);
</script>

<template>
  <ToolWorkbench
    description="Compose an HTTP request locally, then export it to the client you use."
  >
    <div class="grid gap-5">
      <div class="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <UFormField label="Method">
          <USelect
            v-model="method"
            :items="methods"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Request URL">
          <UInput
            v-model="url"
            class="w-full font-mono"
            placeholder="https://api.example.com/users"
          />
        </UFormField>
      </div>
      <div class="grid gap-5 lg:grid-cols-2">
        <UFormField
          label="Query parameters"
          help="One key=value pair per line."
        >
          <UTextarea
            v-model="query"
            :rows="6"
            class="w-full font-mono"
            placeholder="page=1"
          />
        </UFormField>
        <UFormField
          label="Headers"
          help="One Header: value pair per line."
        >
          <UTextarea
            v-model="headers"
            :rows="6"
            class="w-full font-mono"
            placeholder="Accept: application/json"
          />
        </UFormField>
      </div>
      <UFormField
        label="Body"
        help="Used for methods other than GET."
      >
        <UTextarea
          v-model="body"
          :rows="6"
          class="w-full font-mono"
          placeholder="{'name':'Ada'}"
        />
      </UFormField>
      <div class="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:items-end">
        <UFormField label="Export as">
          <USelect
            v-model="format"
            :items="formats"
            value-key="value"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Generated request">
          <UTextarea
            :model-value="output"
            :rows="5"
            readonly
            class="w-full font-mono"
          />
        </UFormField>
        <UButton
          label="Copy"
          icon="i-tabler-copy"
          color="neutral"
          variant="soft"
          @click="copyText(output)"
        />
      </div>
    </div>
  </ToolWorkbench>
</template>
