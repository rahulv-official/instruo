export default defineAppConfig({
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
