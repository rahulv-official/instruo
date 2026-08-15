export default defineAppConfig({
  footer: {
    credits: `© ${new Date().getFullYear()} Instruo`,
    description:
      "Browser tools for small jobs and games for short breaks. Everything opens without an account.",
    tagline: "Useful when you need it.",
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
        label: "Other products",
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
        icon: "i-tabler-brand-x",
        to: "https://x.com/rahulv_dev",
        target: "_blank",
        "aria-label": "Instruo on X",
      },
      {
        icon: "i-tabler-brand-github",
        to: "https://github.com/rahulv-official/instruo",
        target: "_blank",
        "aria-label": "Instruo on GitHub",
      },
    ],
  },
  ui: {
    colors: {
      primary: "orange",
      neutral: "neutral",
    },
    icons: {
      arrowDown: "i-tabler-arrow-down",
      arrowLeft: "i-tabler-arrow-left",
      arrowRight: "i-tabler-arrow-right",
      arrowUp: "i-tabler-arrow-up",
      caution: "i-tabler-alert-circle",
      check: "i-tabler-circle-check",
      chevronDoubleLeft: "i-tabler-chevrons-left",
      chevronDoubleRight: "i-tabler-chevrons-right",
      chevronDown: "i-tabler-chevron-down",
      chevronLeft: "i-tabler-chevron-left",
      chevronRight: "i-tabler-chevron-right",
      chevronUp: "i-tabler-chevron-up",
      close: "i-tabler-x",
      copy: "i-tabler-copy",
      copyCheck: "i-tabler-copy-check",
      dark: "i-tabler-moon",
      drag: "i-tabler-grip-vertical",
      ellipsis: "i-tabler-dots",
      error: "i-tabler-circle-x",
      external: "i-tabler-arrow-up-right",
      eye: "i-tabler-eye",
      eyeOff: "i-tabler-eye-off",
      file: "i-tabler-file",
      folder: "i-tabler-folder",
      folderOpen: "i-tabler-folder-open",
      hash: "i-tabler-hash",
      info: "i-tabler-info-circle",
      light: "i-tabler-sun",
      loading: "i-tabler-loader",
      menu: "i-tabler-menu-2",
      minus: "i-tabler-minus",
      panelClose: "i-tabler-layout-sidebar-left-collapse",
      panelOpen: "i-tabler-layout-sidebar-left-expand",
      plus: "i-tabler-plus",
      reload: "i-tabler-rotate",
      search: "i-tabler-search",
      stop: "i-tabler-square",
      star: "i-tabler-star",
      success: "i-tabler-circle-check",
      system: "i-tabler-device-desktop",
      tip: "i-tabler-bulb",
      upload: "i-tabler-upload",
      warning: "i-tabler-alert-triangle",
    },
    button: {
      slots: {
        base: "min-h-9 rounded-md font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:translate-y-px disabled:active:translate-y-0",
      },
      compoundVariants: [
        {
          color: "primary",
          variant: "solid",
          class:
            "bg-[linear-gradient(180deg,#3a3c40_0%,#24262a_100%)] text-white ring-1 ring-inset ring-black/20 shadow-action hover:bg-[linear-gradient(180deg,#44474c_0%,#292b30_100%)] active:bg-[linear-gradient(180deg,#2a2c30_0%,#202226_100%)] active:shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] focus-visible:outline-primary/30 disabled:bg-[linear-gradient(180deg,#3a3c40_0%,#24262a_100%)] dark:bg-[linear-gradient(180deg,#ffffff_0%,#e4e5e7_100%)] dark:text-[#15171a] dark:ring-white/15 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.85),0_1px_1px_rgb(0_0_0/0.35),0_2px_3px_rgb(0_0_0/0.2)] dark:hover:bg-[linear-gradient(180deg,#ffffff_0%,#eff0f1_100%)] dark:active:bg-[linear-gradient(180deg,#e4e5e7_0%,#d5d7da_100%)] dark:disabled:bg-[linear-gradient(180deg,#ffffff_0%,#e4e5e7_100%)]",
        },
      ],
      defaultVariants: {
        size: "md",
      },
    },
    input: {
      slots: {
        base: "min-h-10 rounded-md !bg-[var(--ui-bg-field)] !ring-[var(--ui-border-field)] shadow-[inset_0_1px_0_rgb(255_255_255/0.55)] transition-[background-color,box-shadow,color] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:!ring-default focus-visible:!ring-primary/35 read-only:!bg-muted/65 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]",
      },
    },
    inputNumber: {
      slots: {
        base: "min-h-10 rounded-md !bg-[var(--ui-bg-field)] !ring-[var(--ui-border-field)] shadow-[inset_0_1px_0_rgb(255_255_255/0.55)] transition-[background-color,box-shadow,color] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:!ring-default focus-visible:!ring-primary/35 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]",
      },
    },
    textarea: {
      slots: {
        base: "rounded-md !bg-[var(--ui-bg-field)] !ring-[var(--ui-border-field)] shadow-[inset_0_1px_0_rgb(255_255_255/0.55)] transition-[background-color,box-shadow,color] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:!ring-default focus-visible:!ring-primary/35 read-only:!bg-muted/65 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]",
      },
    },
    select: {
      slots: {
        base: "min-h-10 rounded-md !bg-[var(--ui-bg-field)] !ring-[var(--ui-border-field)] shadow-[inset_0_1px_0_rgb(255_255_255/0.55)] transition-[background-color,box-shadow,color] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:!ring-default focus-visible:!ring-primary/35 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]",
        content: "rounded-lg bg-elevated ring-[var(--ui-border-field)] shadow-menu",
        item: "rounded-md",
      },
    },
    selectMenu: {
      slots: {
        base: "min-h-10 rounded-md !bg-[var(--ui-bg-field)] !ring-[var(--ui-border-field)] shadow-[inset_0_1px_0_rgb(255_255_255/0.55)] transition-[background-color,box-shadow,color] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:!ring-default focus-visible:!ring-primary/35 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]",
        content: "rounded-lg bg-elevated ring-[var(--ui-border-field)] shadow-menu",
        item: "rounded-md",
      },
    },
    formField: {
      slots: {
        label: "text-sm font-medium text-highlighted",
        description: "mt-1 text-sm leading-5 text-muted",
        hint: "text-xs text-dimmed",
        container: "mt-2",
      },
    },
    checkbox: {
      slots: {
        base: "rounded-sm !ring-[var(--ui-border-field)]",
        label: "text-sm font-medium text-default",
        description: "mt-0.5 text-sm leading-5 text-muted",
      },
    },
    fileUpload: {
      slots: {
        base: "min-h-36 rounded-lg border border-dashed border-[var(--ui-border-field)] bg-[var(--ui-bg-field)] p-5 transition-[background-color,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-accented hover:bg-elevated focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/15 data-[dragging=true]:border-primary/50 data-[dragging=true]:bg-primary/5",
        wrapper: "gap-0.5",
        avatar: "bg-muted text-muted ring-1 ring-muted",
        label: "mt-3 text-sm font-medium text-highlighted",
        description: "mt-1 max-w-sm text-xs leading-5 text-muted",
        file: "rounded-md border border-[var(--ui-border-field)] bg-elevated",
      },
    },
    card: {
      slots: {
        root: "rounded-lg ring-muted",
        header: "border-muted",
        footer: "border-muted",
      },
    },
    modal: {
      slots: {
        overlay: "bg-default/80 backdrop-blur-sm",
        content: "rounded-lg bg-elevated ring-[var(--ui-border-field)] shadow-menu",
      },
    },
  },
});
