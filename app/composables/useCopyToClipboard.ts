export function useCopyToClipboard() {
  const toast = useToast();
  const { copy, isSupported } = useClipboard({ legacy: true });

  async function copyText(text: string) {
    if (!text) return;

    try {
      await copy(text);
      toast.add({
        title: "Copied",
        description: "Output copied to your clipboard.",
        color: "success",
        icon: "i-tabler-copy-check",
      });
    } catch {
      toast.add({
        title: "Copy failed",
        description: "Select the output and copy it manually.",
        color: "error",
        icon: "i-tabler-alert-circle",
      });
    }
  }

  return { copyText, isSupported };
}
