import { Toaster } from "vue-sonner";
import { createApp } from "vue";
import { defineNuxtPlugin } from "#app";

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    const toasterApp = createApp(Toaster, {
      position: "top-right",
      toastOptions: {
        closeButton: true,
        duration: 2000,
      },
      theme: "dark",
    });
    const toasterDiv = document.createElement("div");
    document.body.appendChild(toasterDiv);
    toasterApp.mount(toasterDiv);
  }
});
