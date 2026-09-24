import { GameMenuWrapper } from "../components/game-menu/GameMenuWrapper";
import ThemeCustomizer from "./ThemeCustomizer";

/**
 * Composite island: header floating tools (theme customizer + game menu) as
 * ONE React root instead of two. Shared on every page via Header.astro.
 */
export default function HeaderTools() {
  return (
    <>
      <ThemeCustomizer />
      <GameMenuWrapper />
    </>
  );
}
