export default defineAppConfig({
  shadcnDocs: {
    site: {
      name: "instruo.org",
      description:
        "Instruo offers fast, online tools for developers and creatives—code formatting, image compression, text utilities, and more. No installation needed.",
    },
    theme: {
      customizable: true,
      color: "zinc",
      radius: 0.75,
    },
    header: {
      title: "instruo.org",
      showTitle: true,
      darkModeToggle: true,
      logo: {
        light: "/logo.png",
        dark: "/logo-dark.png",
      },
      nav: [],
      links: [
        {
          icon: "lucide:github",
          to: "https://github.com/rahulv-official/instruo",
          target: "_blank",
        },
        {
          icon: "lucide:x",
          to: "https://x.com/rahulv_dev",
          target: "_blank",
        },
        {
          icon: "lucide:bot",
          to: "https://discord.gg/pPyHNfryrv",
          target: "_blank",
        },
      ],
    },
    aside: {
      useLevel: true,
      collapse: false,
      folderStyle: "group",
    },
    main: {
      breadCrumb: true,
      showTitle: true,
    },
    footer: {
      credits: "Copyright © 2024",
      links: [
        {
          title: "Built by rahulv.dev",
          icon: "lucide:globe",
          to: "https://rahulv.dev",
          target: "_blank",
        },
        {
          title: "Beautified using Inspira UI",
          icon: "lucide:heart",
          to: "https://inspira-ui.com",
          target: "_blank",
        },
      ],
    },
    toc: {
      enable: true,
      title: "On This Page",
      links: [
        {
          title: "Star on GitHub",
          icon: "lucide:star",
          to: "https://github.com/rahulv-official/instruo",
          target: "_blank",
        },
        {
          title: "Create Issues",
          icon: "lucide:circle-dot",
          to: "https://github.com/rahulv-official/instruo/issues",
          target: "_blank",
        },
        {
          title: "Forum",
          icon: "lucide:newspaper",
          to: "https://github.com/rahulv-official/instruo/discussions",
          target: "_blank",
        },
        {
          title: "Join Discord",
          icon: "lucide:bot",
          to: "https://discord.gg/pPyHNfryrv",
          target: "_blank",
        },
        {
          title: "Built by rahulv.dev",
          icon: "lucide:star",
          to: "https://rahulv.dev",
          target: "_blank",
        },
      ],
    },
    search: {
      enable: true,
      inAside: false,
    },
  },
});
