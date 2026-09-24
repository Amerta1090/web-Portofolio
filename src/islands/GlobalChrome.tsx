import { Toaster } from "sonner";
import AssistantBot from "./AssistantBot";
import CommandPalette from "./CommandPalette";
import CustomCursor from "./CustomCursor";

/**
 * Composite island: global chrome — sonner Toaster, assistant FAB, command
 * palette and custom cursor — as ONE React root instead of four per page.
 * AmbientScene stays a separate `client:visible` island on purpose
 * (tier-3 gate + lazy R3F SceneContent must not hydrate eagerly).
 */
export default function GlobalChrome() {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--color-surface-secondary)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-3)",
          },
        }}
      />
      <AssistantBot />
      <CommandPalette />
      <CustomCursor />
    </>
  );
}
