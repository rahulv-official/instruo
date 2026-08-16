<script setup lang="ts">
interface Question {
  answer: number;
  explanation: string;
  options: string[];
  prompt: string;
  topic: string;
}

interface OpenTriviaQuestion {
  category: string;
  correct_answer: string;
  difficulty: string;
  incorrect_answers: string[];
  question: string;
  type: string;
}

interface OpenTriviaResponse {
  response_code: number;
  results: OpenTriviaQuestion[];
}

const roundSize = 10;
const questionBank: Question[] = [
  {
    answer: 2,
    explanation: "Mars appears red because iron minerals in its soil oxidize, or rust.",
    options: ["Venus", "Jupiter", "Mars", "Mercury"],
    prompt: "Which planet is known as the Red Planet?",
    topic: "Science",
  },
  {
    answer: 1,
    explanation: "The Pacific Ocean covers more area than all of Earth’s land combined.",
    options: ["Atlantic", "Pacific", "Indian", "Arctic"],
    prompt: "Which is the largest ocean on Earth?",
    topic: "Geography",
  },
  {
    answer: 0,
    explanation: "Jane Austen published Pride and Prejudice in 1813.",
    options: ["Jane Austen", "Virginia Woolf", "George Eliot", "Mary Shelley"],
    prompt: "Who wrote Pride and Prejudice?",
    topic: "Books",
  },
  {
    answer: 3,
    explanation: "Au comes from aurum, the Latin word for gold.",
    options: ["Silver", "Argon", "Aluminium", "Gold"],
    prompt: "Which element uses the symbol Au?",
    topic: "Science",
  },
  {
    answer: 2,
    explanation: "An octagon has eight sides; the prefix oct- means eight.",
    options: ["Six", "Seven", "Eight", "Nine"],
    prompt: "How many sides does an octagon have?",
    topic: "Math",
  },
  {
    answer: 1,
    explanation: "Light travels fastest in a vacuum, at about 299,792 kilometres per second.",
    options: ["Sound", "Light", "Heat", "Wind"],
    prompt: "What travels fastest in a vacuum?",
    topic: "Science",
  },
  {
    answer: 0,
    explanation: "The Nile flows north through northeastern Africa into the Mediterranean Sea.",
    options: ["The Nile", "The Amazon", "The Danube", "The Yangtze"],
    prompt: "Which river flows into the Mediterranean Sea?",
    topic: "Geography",
  },
  {
    answer: 3,
    explanation: "A haiku traditionally has three lines with a 5–7–5 syllable pattern in English.",
    options: ["Two", "Three", "Four", "Five"],
    prompt: "How many syllables are in the first line of a traditional haiku?",
    topic: "Language",
  },
  {
    answer: 2,
    explanation: "The small intestine is where most nutrient absorption takes place.",
    options: ["The heart", "The lungs", "The small intestine", "The liver"],
    prompt: "Where does most nutrient absorption happen?",
    topic: "Nature",
  },
  {
    answer: 1,
    explanation: "A triangle’s interior angles always add up to 180 degrees in Euclidean geometry.",
    options: ["90°", "180°", "270°", "360°"],
    prompt: "What is the sum of a triangle’s interior angles?",
    topic: "Math",
  },
  {
    answer: 0,
    explanation: "The Voyager probes carry a Golden Record with sounds and images from Earth.",
    options: ["Voyager", "Apollo", "Hubble", "Pioneer"],
    prompt: "Which mission carries a Golden Record into interstellar space?",
    topic: "Space",
  },
  {
    answer: 3,
    explanation:
      "The printing press is commonly associated with Johannes Gutenberg in 15th-century Europe.",
    options: ["Galileo Galilei", "Leonardo da Vinci", "Isaac Newton", "Johannes Gutenberg"],
    prompt: "Who is commonly credited with introducing the printing press to Europe?",
    topic: "History",
  },
  {
    answer: 2,
    explanation:
      "The Great Barrier Reef lies off the coast of Queensland in northeastern Australia.",
    options: ["South Africa", "Mexico", "Australia", "Indonesia"],
    prompt: "Where will you find the Great Barrier Reef?",
    topic: "Geography",
  },
  {
    answer: 1,
    explanation: "The piano has 88 standard keys: 52 white and 36 black.",
    options: ["66", "88", "96", "104"],
    prompt: "How many keys does a standard modern piano have?",
    topic: "Music",
  },
  {
    answer: 0,
    explanation:
      "Photosynthesis uses sunlight to help plants turn water and carbon dioxide into food.",
    options: ["Photosynthesis", "Fermentation", "Respiration", "Evaporation"],
    prompt: "What process lets plants make food using sunlight?",
    topic: "Nature",
  },
  {
    answer: 3,
    explanation: "The hexagon is the six-sided shape famously used in honeycomb cells.",
    options: ["Pentagon", "Octagon", "Triangle", "Hexagon"],
    prompt: "What shape do honeybees use for their honeycomb cells?",
    topic: "Nature",
  },
  {
    answer: 1,
    explanation: "The Moon is Earth’s natural satellite and completes an orbit in roughly 27 days.",
    options: ["Mars", "The Moon", "Venus", "The Sun"],
    prompt: "What is Earth’s natural satellite?",
    topic: "Space",
  },
  {
    answer: 2,
    explanation: "A byte contains eight bits, each of which can be either 0 or 1.",
    options: ["Four", "Six", "Eight", "Ten"],
    prompt: "How many bits make one byte?",
    topic: "Technology",
  },
  {
    answer: 0,
    explanation: "The equator divides Earth into the Northern and Southern Hemispheres.",
    options: ["The equator", "The prime meridian", "The tropic of Cancer", "The Arctic Circle"],
    prompt: "Which line divides Earth into northern and southern halves?",
    topic: "Geography",
  },
  {
    answer: 3,
    explanation: "The Wright brothers made their first powered, controlled flight in 1903.",
    options: ["1900", "1901", "1902", "1903"],
    prompt: "In which year did the Wright brothers make their first powered flight?",
    topic: "History",
  },
  {
    answer: 1,
    explanation: "The CSS property display controls how an element participates in layout.",
    options: ["position", "display", "float", "layout"],
    prompt: "Which CSS property controls an element’s layout mode?",
    topic: "Web",
  },
  {
    answer: 2,
    explanation: "A palindrome reads the same forwards and backwards, such as ‘level’.",
    options: ["An acronym", "A homonym", "A palindrome", "An anagram"],
    prompt: "What do you call a word that reads the same in both directions?",
    topic: "Language",
  },
  {
    answer: 0,
    explanation: "The speed of light is often rounded to 300,000 kilometres per second.",
    options: ["300,000 km/s", "30,000 km/s", "3,000 km/s", "3,000,000 km/s"],
    prompt: "About how fast does light travel in a vacuum?",
    topic: "Space",
  },
  {
    answer: 3,
    explanation: "In binary, 10 represents the decimal number two.",
    options: ["One", "Three", "Ten", "Two"],
    prompt: "What decimal number does binary 10 represent?",
    topic: "Technology",
  },
  {
    answer: 1,
    explanation:
      "The Sahara stretches across much of North Africa and is the world’s largest hot desert.",
    options: ["Gobi", "Sahara", "Kalahari", "Atacama"],
    prompt: "Which is the world’s largest hot desert?",
    topic: "Geography",
  },
  {
    answer: 2,
    explanation: "Water freezes at 0°C at standard atmospheric pressure.",
    options: ["-10°C", "-1°C", "0°C", "10°C"],
    prompt: "At what temperature does water freeze on the Celsius scale?",
    topic: "Science",
  },
  {
    answer: 0,
    explanation: "The ampere is the SI base unit for electric current.",
    options: ["Ampere", "Volt", "Watt", "Ohm"],
    prompt: "Which unit measures electric current?",
    topic: "Science",
  },
  {
    answer: 3,
    explanation: "A right angle measures exactly 90 degrees.",
    options: ["45°", "60°", "120°", "90°"],
    prompt: "How many degrees are in a right angle?",
    topic: "Math",
  },
  {
    answer: 1,
    explanation: "The Great Gatsby was written by F. Scott Fitzgerald and published in 1925.",
    options: ["Ernest Hemingway", "F. Scott Fitzgerald", "Mark Twain", "John Steinbeck"],
    prompt: "Who wrote The Great Gatsby?",
    topic: "Books",
  },
  {
    answer: 2,
    explanation: "The command git clone copies an existing repository to your local machine.",
    options: ["git copy", "git fork", "git clone", "git pull"],
    prompt: "Which Git command copies a repository locally?",
    topic: "Technology",
  },
  {
    answer: 0,
    explanation: "Bamboo is a grass, even though some species grow tall and look like trees.",
    options: ["Bamboo", "Cedar", "Palm", "Maple"],
    prompt: "Which of these is botanically a grass?",
    topic: "Nature",
  },
];

const questionIndex = ref(0);
const roundQuestions = ref<Question[]>([]);
const questionPool = shallowRef<Question[]>([]);
const apiState = ref<"loading" | "ready" | "fallback">("loading");
const apiError = ref("");
const selectedAnswer = ref<number | null>(null);
const score = ref(0);
const streak = ref(0);
const bestScore = ref(0);

const currentQuestion = computed(() => roundQuestions.value[questionIndex.value]);
const isAnswered = computed(() => selectedAnswer.value !== null);
const isCorrect = computed(() => selectedAnswer.value === currentQuestion.value?.answer);
const isComplete = computed(
  () => roundQuestions.value.length > 0 && questionIndex.value >= roundQuestions.value.length,
);
const status = computed(() => {
  if (apiState.value === "loading") return "Loading fresh questions…";
  if (isComplete.value)
    return score.value >= 8
      ? `Round complete: ${score.value}/${roundQuestions.value.length}. Excellent recall.`
      : `Round complete: ${score.value}/${roundQuestions.value.length}. Try a fresh round.`;
  if (!isAnswered.value) return "Choose one answer.";
  return isCorrect.value
    ? "Correct. Keep the streak alive."
    : `Not quite. ${currentQuestion.value?.options[currentQuestion.value.answer]} is right.`;
});
const progressLabel = computed(
  () =>
    roundQuestions.value.length
      ? `${Math.min(questionIndex.value + 1, roundQuestions.value.length)}/${roundQuestions.value.length}`
      : `—/${roundSize}`,
);

function decodeText(value: string) {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // Keep original value when an API response contains a malformed escape.
  }
  if (!import.meta.client) return decoded;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = decoded;
  return textarea.value;
}

function shuffled<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap]!, result[index]!];
  }
  return result;
}

async function loadQuestions() {
  apiState.value = "loading";
  apiError.value = "";

  try {
    const response = await $fetch<OpenTriviaResponse>(
      "https://opentdb.com/api.php?amount=50&type=multiple&encode=url3986",
    );
    if (response.response_code !== 0 || response.results.length === 0) {
      throw new Error(`Open Trivia DB response code ${response.response_code}`);
    }

    const questions = response.results
      .filter((question) => question.type === "multiple" && question.incorrect_answers.length === 3)
      .map((question) => {
        const answer = decodeText(question.correct_answer);
        const options = shuffled([
          answer,
          ...question.incorrect_answers.map((option) => decodeText(option)),
        ]);
        return {
          answer: options.indexOf(answer),
          explanation: `${question.difficulty} question from ${decodeText(question.category)}. Correct answer: ${answer}.`,
          options,
          prompt: decodeText(question.question),
          topic: decodeText(question.category),
        } satisfies Question;
      });

    if (questions.length < roundSize) throw new Error("Open Trivia DB returned too few questions");
    questionPool.value = questions;
    apiState.value = "ready";
    newRound();
  } catch (error) {
    questionPool.value = questionBank;
    apiState.value = "fallback";
    apiError.value = error instanceof Error ? error.message : "Could not reach Open Trivia DB";
    newRound();
  }
}

function newRound() {
  const pool = questionPool.value.length ? questionPool.value : questionBank;
  roundQuestions.value = shuffled(pool).slice(0, roundSize);
  questionIndex.value = 0;
  selectedAnswer.value = null;
  score.value = 0;
  streak.value = 0;
}

function selectAnswer(index: number) {
  if (isAnswered.value || isComplete.value || !currentQuestion.value) return;
  selectedAnswer.value = index;
  if (index === currentQuestion.value.answer) {
    score.value += 1;
    streak.value += 1;
    bestScore.value = Math.max(bestScore.value, score.value);
  } else {
    streak.value = 0;
  }
}

function nextQuestion() {
  if (!isAnswered.value) return;
  questionIndex.value += 1;
  selectedAnswer.value = null;
}

function optionClass(index: number) {
  if (!isAnswered.value)
    return "border-default/70 bg-default text-highlighted hover:bg-elevated/60";
  if (index === currentQuestion.value?.answer) return "border-success bg-success/15 text-success";
  if (index === selectedAnswer.value) return "border-error bg-error/15 text-error";
  return "border-default/50 bg-default text-muted";
}

if (import.meta.dev && questionBank.some((question) => !question.options[question.answer])) {
  throw new Error("Quick Trivia question check failed");
}

onMounted(loadQuestions);
</script>

<template>
  <ToolWorkbench
    description="A rotating ten-question round from Open Trivia DB. Learn something, then play again."
  >
    <div class="mx-auto grid max-w-2xl gap-6">
      <div
        class="border-default/70 flex flex-wrap items-center justify-between gap-4 border-b pb-4"
      >
        <p
          class="flex items-center gap-2 text-sm leading-6"
          :class="
            isComplete && score < 8
              ? 'text-error'
              : isComplete || (isAnswered && isCorrect)
                ? 'text-success'
                : isAnswered
                  ? 'text-error'
                  : 'text-toned'
          "
          role="status"
          aria-live="polite"
        >
          <UIcon
            v-if="(isComplete && score < 8) || (isAnswered && !isCorrect)"
            name="i-tabler-circle-x"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          <UIcon
            v-else-if="isComplete || (isAnswered && isCorrect)"
            name="i-tabler-circle-check"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          {{ status }}
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

      <UAlert
        v-if="apiState === 'loading'"
        color="neutral"
        variant="subtle"
        icon="i-tabler-cloud-download"
        title="Fetching fresh questions"
        description="Open Trivia DB is loading a larger question pool for this round."
      />

      <UAlert
        v-else-if="apiState === 'fallback'"
        color="warning"
        variant="subtle"
        icon="i-tabler-wifi-off"
        title="Offline question bank"
        :description="`${apiError} Showing local questions so you can keep playing.`"
      >
        <template #actions>
          <UButton
            label="Try again"
            color="warning"
            variant="outline"
            size="sm"
            icon="i-tabler-refresh"
            @click="loadQuestions"
          />
        </template>
      </UAlert>

      <template v-if="!isComplete && currentQuestion">
        <div
          class="border-default/70 bg-muted/20 grid min-h-44 content-center gap-4 border p-6 sm:min-h-52 sm:p-8"
        >
          <span class="text-muted text-xs font-semibold tracking-[0.14em] uppercase">{{
            currentQuestion.topic
          }}</span>
          <h2
            class="text-highlighted text-2xl leading-tight font-semibold text-balance sm:text-3xl"
          >
            {{ currentQuestion.prompt }}
          </h2>
        </div>

        <div class="grid gap-2 sm:grid-cols-2 sm:gap-3">
          <button
            v-for="(option, index) in currentQuestion.options"
            :key="option"
            type="button"
            class="focus-visible:ring-primary min-h-14 border px-4 text-left text-sm font-medium transition-[background-color,border-color,transform] duration-200 focus-visible:ring-2 focus-visible:outline-none active:translate-y-px disabled:cursor-default"
            :class="optionClass(index)"
            :disabled="isAnswered"
            @click="selectAnswer(index)"
          >
            <span class="text-muted mr-3 font-mono">{{ String.fromCharCode(65 + index) }}</span
            >{{ option }}
          </button>
        </div>

        <div
          v-if="isAnswered"
          class="border-default/60 bg-muted/15 border-l-primary/50 grid gap-1 border-l-2 px-4 py-3"
        >
          <span class="text-muted text-xs font-semibold tracking-[0.12em] uppercase">Why</span>
          <p class="text-toned text-sm leading-6">{{ currentQuestion.explanation }}</p>
        </div>
      </template>

      <div
        class="border-default/70 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
      >
          <p class="text-muted text-sm leading-6">
          Best round: {{ bestScore }}/{{ roundSize }}. Questions load locally into this tab.
        </p>
        <div class="flex flex-wrap gap-2">
          <UButton
            label="New round"
            icon="i-tabler-dice-5"
            color="neutral"
            variant="ghost"
            :disabled="apiState === 'loading'"
            @click="newRound"
          />
          <UButton
            :label="isComplete ? 'Play another' : 'Next question'"
            color="neutral"
            variant="outline"
            trailing-icon="i-tabler-arrow-right"
            :disabled="apiState === 'loading' || (!isComplete && !isAnswered)"
            @click="isComplete ? newRound() : nextQuestion()"
          />
        </div>
      </div>

      <p class="text-muted flex flex-wrap items-center justify-between gap-2 text-xs">
        <span>Fresh questions from Open Trivia DB. Answers stay in this browser.</span>
        <ULink
          to="https://opentdb.com/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-toned underline-offset-4 hover:underline"
        >
          Open Trivia DB · CC BY-SA 4.0
        </ULink>
      </p>
    </div>
  </ToolWorkbench>
</template>
