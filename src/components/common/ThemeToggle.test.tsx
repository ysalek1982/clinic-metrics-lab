import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  it("refleja la preferencia guardada y aplica el tema al documento", async () => {
    localStorage.clear();
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: /tema actual: claro/i })).toBeInTheDocument();
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("light"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
