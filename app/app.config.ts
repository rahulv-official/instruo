export default defineAppConfig({
  ui: {
    colors: {
      neutral: "zinc",
    },
    button: {
      slots: {
        base: "active:hover:scale-[97%] transition-all ease-linear duration-100 disabled:active:hover:scale-100",
      },
    },
  },
});
