<script setup lang="ts">
interface Question {
  answer: string;
  country: string;
  fact: string;
  options: string[];
}

const roundSize = 10;
const questionBank: Question[] = [
  {
    answer: "Tokyo",
    country: "Japan",
    fact: "Tokyo is one of the world’s most populous metropolitan areas.",
    options: ["Tokyo", "Kyoto", "Osaka", "Sapporo"],
  },
  {
    answer: "Brasília",
    country: "Brazil",
    fact: "Brasília was purpose-built and became Brazil’s capital in 1960.",
    options: ["Rio de Janeiro", "Brasília", "Salvador", "São Paulo"],
  },
  {
    answer: "Ottawa",
    country: "Canada",
    fact: "Ottawa sits on the Ottawa River in the province of Ontario.",
    options: ["Toronto", "Vancouver", "Ottawa", "Montreal"],
  },
  {
    answer: "Nairobi",
    country: "Kenya",
    fact: "Nairobi is known as a gateway to Kenya’s wildlife reserves.",
    options: ["Mombasa", "Nairobi", "Kisumu", "Eldoret"],
  },
  {
    answer: "Lisbon",
    country: "Portugal",
    fact: "Lisbon is built across seven hills beside the Tagus estuary.",
    options: ["Porto", "Lisbon", "Faro", "Braga"],
  },
  {
    answer: "Seoul",
    country: "South Korea",
    fact: "Seoul lies on the Han River and has been a major Korean settlement for centuries.",
    options: ["Busan", "Incheon", "Seoul", "Daegu"],
  },
  {
    answer: "Reykjavík",
    country: "Iceland",
    fact: "Reykjavík is the world’s northernmost national capital.",
    options: ["Akureyri", "Reykjavík", "Höfn", "Kópavogur"],
  },
  {
    answer: "Canberra",
    country: "Australia",
    fact: "Canberra was selected as a compromise between Sydney and Melbourne.",
    options: ["Sydney", "Perth", "Canberra", "Melbourne"],
  },
  {
    answer: "Kampala",
    country: "Uganda",
    fact: "Kampala is built across seven hills near the northern shore of Lake Victoria.",
    options: ["Kampala", "Lagos", "Accra", "Nairobi"],
  },
  {
    answer: "Helsinki",
    country: "Finland",
    fact: "Helsinki is set on the shore of the Gulf of Finland in the Baltic Sea.",
    options: ["Turku", "Tampere", "Helsinki", "Oulu"],
  },
  {
    answer: "Wellington",
    country: "New Zealand",
    fact: "Wellington is famous for its harbour and strong southerly winds.",
    options: ["Auckland", "Christchurch", "Dunedin", "Wellington"],
  },
  {
    answer: "Marrakesh",
    country: "Morocco",
    fact: "Morocco’s official capital is Rabat; Marrakesh is a historic imperial city.",
    options: ["Casablanca", "Marrakesh", "Rabat", "Fez"],
  },
  {
    answer: "Athens",
    country: "Greece",
    fact: "Athens is named for Athena, the ancient city’s patron goddess.",
    options: ["Athens", "Thessaloniki", "Patras", "Sparta"],
  },
  {
    answer: "Buenos Aires",
    country: "Argentina",
    fact: "Buenos Aires sits on the western shore of the Río de la Plata.",
    options: ["Córdoba", "Mendoza", "Rosario", "Buenos Aires"],
  },
  {
    answer: "Cairo",
    country: "Egypt",
    fact: "Cairo stands near the Nile Delta and is home to the Egyptian Museum.",
    options: ["Alexandria", "Giza", "Cairo", "Luxor"],
  },
  {
    answer: "Vienna",
    country: "Austria",
    fact: "Vienna has been a major centre of classical music, diplomacy, and coffeehouse culture.",
    options: ["Salzburg", "Vienna", "Graz", "Linz"],
  },
  {
    answer: "Hanoi",
    country: "Vietnam",
    fact: "Hanoi is known for its Old Quarter and lakes in the city centre.",
    options: ["Da Nang", "Hanoi", "Hue", "Ho Chi Minh City"],
  },
  {
    answer: "Nicosia",
    country: "Cyprus",
    fact: "Nicosia is located near the centre of the island of Cyprus.",
    options: ["Limassol", "Paphos", "Nicosia", "Larnaca"],
  },
  {
    answer: "Lima",
    country: "Peru",
    fact: "Lima was founded in 1535 on the Pacific coast by Francisco Pizarro.",
    options: ["Cusco", "Arequipa", "Lima", "Trujillo"],
  },
  {
    answer: "Bern",
    country: "Switzerland",
    fact: "Bern’s old town is a UNESCO World Heritage site built around the Aare River.",
    options: ["Zurich", "Geneva", "Basel", "Bern"],
  },
  {
    answer: "Tallinn",
    country: "Estonia",
    fact: "Tallinn’s medieval old town is one of Europe’s best-preserved city centres.",
    options: ["Riga", "Tallinn", "Vilnius", "Tartu"],
  },
  {
    answer: "Abuja",
    country: "Nigeria",
    fact: "Abuja replaced Lagos as Nigeria’s capital in 1991.",
    options: ["Lagos", "Kano", "Abuja", "Ibadan"],
  },
  {
    answer: "Ulaanbaatar",
    country: "Mongolia",
    fact: "Ulaanbaatar is the coldest national capital by average annual temperature.",
    options: ["Erdenet", "Ulaanbaatar", "Darkhan", "Ölgii"],
  },
  {
    answer: "Dublin",
    country: "Ireland",
    fact: "Dublin sits at the mouth of the River Liffey on Ireland’s east coast.",
    options: ["Cork", "Galway", "Limerick", "Dublin"],
  },
];

const roundQuestions = ref<Question[]>(questionBank.slice(0, roundSize));
const index = ref(0);
const selected = ref("");
const score = ref(0);
const streak = ref(0);
const bestScore = ref(0);

const finished = computed(() => index.value >= roundQuestions.value.length);
const question = computed(() => roundQuestions.value[index.value]);
const isCorrect = computed(() => selected.value === question.value?.answer);
const statusText = computed(() => {
  if (finished.value)
    return `Round complete. ${score.value}/${roundQuestions.value.length} correct.`;
  if (!selected.value) return `Which capital belongs to ${question.value?.country}?`;
  return isCorrect.value
    ? "Correct. Keep the streak alive."
    : `Not quite. The answer is ${question.value?.answer}.`;
});
const progressLabel = computed(
  () => `${Math.min(index.value + 1, roundQuestions.value.length)}/${roundQuestions.value.length}`,
);

function shuffled<T>(items: T[]) {
  const result = [...items];
  for (let cursor = result.length - 1; cursor > 0; cursor -= 1) {
    const swap = Math.floor(Math.random() * (cursor + 1));
    [result[cursor], result[swap]] = [result[swap]!, result[cursor]!];
  }
  return result;
}

function newRound() {
  roundQuestions.value = shuffled(questionBank).slice(0, roundSize);
  index.value = 0;
  score.value = 0;
  streak.value = 0;
  selected.value = "";
}

function answer(value: string) {
  if (selected.value || finished.value || !question.value) return;
  selected.value = value;
  if (value === question.value.answer) {
    score.value += 1;
    streak.value += 1;
    bestScore.value = Math.max(bestScore.value, score.value);
  } else {
    streak.value = 0;
  }
}

function nextQuestion() {
  if (!selected.value) return;
  selected.value = "";
  index.value += 1;
}
</script>

<template>
  <ToolWorkbench
    description="A rotating ten-question geography round drawn from a larger local capital-city bank."
  >
    <div class="mx-auto grid max-w-2xl gap-6 text-center">
      <div
        class="border-default/70 flex flex-wrap items-center justify-between gap-4 border-b pb-4 text-left"
      >
        <p
          class="flex items-center gap-2 text-sm leading-6"
          :class="
            finished || (selected && isCorrect)
              ? 'text-success'
              : selected
                ? 'text-error'
                : 'text-toned'
          "
          role="status"
          aria-live="polite"
        >
          <UIcon
            :name="
              finished || (selected && isCorrect)
                ? 'i-tabler-circle-check'
                : selected
                  ? 'i-tabler-circle-x'
                  : 'i-tabler-map-pin'
            "
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          {{ statusText }}
        </p>
        <div class="text-toned flex items-center gap-3 font-mono text-sm tabular-nums">
          <span>{{ progressLabel }} · {{ score }} points</span>
          <span
            v-if="streak > 1"
            class="text-success"
            >{{ streak }} streak</span
          >
        </div>
      </div>

      <template v-if="!finished && question">
        <div class="border-default/70 bg-muted/20 grid min-h-44 content-center gap-3 border p-8">
          <span class="text-muted text-xs font-semibold tracking-[0.14em] uppercase">Country</span>
          <h2 class="text-highlighted text-3xl font-semibold sm:text-4xl">
            {{ question.country }}
          </h2>
        </div>
        <div class="grid gap-2 sm:grid-cols-2">
          <UButton
            v-for="option in question.options"
            :key="option"
            :label="option"
            color="neutral"
            variant="outline"
            size="lg"
            class="justify-start"
            :class="
              selected === option
                ? option === question.answer
                  ? 'border-success text-success bg-success/10'
                  : 'border-error text-error bg-error/10'
                : ''
            "
            :disabled="!!selected"
            @click="answer(option)"
          />
        </div>
        <div
          v-if="selected"
          class="border-default/60 bg-muted/15 border-l-primary/50 grid gap-1 border-l-2 px-4 py-3 text-left"
        >
          <span class="text-muted text-xs font-semibold tracking-[0.12em] uppercase"
            >Field note</span
          >
          <p class="text-toned text-sm leading-6">{{ question.fact }}</p>
        </div>
      </template>

      <div
        v-else
        class="border-default/70 bg-muted/20 grid gap-4 border p-8"
      >
        <UIcon
          name="i-tabler-world-check"
          class="text-success mx-auto size-8"
          aria-hidden="true"
        />
        <h2 class="text-highlighted text-2xl font-semibold">Round complete</h2>
        <p class="text-toned">
          {{ score }}/{{ roundQuestions.length }} capitals correct. Best round: {{ bestScore }}/{{
            roundSize
          }}.
        </p>
      </div>

      <div
        class="border-default/70 flex flex-wrap items-center justify-between gap-4 border-t pt-5 text-left"
      >
        <p class="text-muted text-sm leading-6">
          New rounds reshuffle the local bank. No account or network request.
        </p>
        <div class="flex flex-wrap gap-2">
          <UButton
            label="New round"
            icon="i-tabler-dice-5"
            color="neutral"
            variant="ghost"
            @click="newRound"
          />
          <UButton
            :label="finished ? 'Play another' : 'Next question'"
            color="neutral"
            variant="outline"
            trailing-icon="i-tabler-arrow-right"
            :disabled="!finished && !selected"
            @click="finished ? newRound() : nextQuestion()"
          />
        </div>
      </div>
    </div>
  </ToolWorkbench>
</template>
