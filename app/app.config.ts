export default defineAppConfig({
  footer: {
    credits: `© ${new Date().getFullYear()} Instruo`,
    description:
      "Fast, private browser utilities and lightweight games. No account or installation required.",
    tagline: "Useful now. Account never.",
    colorMode: true,
    columns: [
      {
        label: "Project",
        children: [
          { label: "All tools", to: "/tools" },
          { label: "All games", to: "/games" },
          {
            label: "Source code",
            to: "https://github.com/rahulv-official/instruo",
            target: "_blank",
          },
          {
            label: "Report an issue",
            to: "https://github.com/rahulv-official/instruo/issues",
            target: "_blank",
          },
          {
            label: "Sponsor",
            to: "https://github.com/sponsors/rahul-vashishtha",
            target: "_blank",
          },
        ],
      },
      {
        label: "More by Author",
        children: [
          { label: "Inspira UI", to: "https://inspira-ui.com", target: "_blank" },
          { label: "Inspira UI Pro", to: "https://pro.inspira-ui.com", target: "_blank" },
          { label: "Akaza UI", to: "https://akaza-ui.com", target: "_blank" },
        ],
      },
      {
        label: "Created by",
        children: [
          { label: "Rahul Vashishtha", to: "https://rahulv.dev", target: "_blank" },
          { label: "Igris Labs", to: "https://igrislabs.com", target: "_blank" },
        ],
      },
    ],
    links: [
      {
        icon: "i-simple-icons-x",
        to: "https://x.com/rahulv_dev",
        target: "_blank",
        "aria-label": "Instruo on X",
      },
      {
        icon: "i-simple-icons-github",
        to: "https://github.com/rahulv-official/instruo",
        target: "_blank",
        "aria-label": "Instruo on GitHub",
      },
    ],
  },
  ui: {
    colors: {
      primary: "orange",
      neutral: "zinc",
    },
    button: {
      slots: {
        base: "rounded-none transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.98] disabled:active:scale-100",
      },
    },
  },
});
