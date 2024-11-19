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
      links: [],
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
      ],
    },
    toc: {
      enable: true,
      title: "On This Page",
      links: [
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
