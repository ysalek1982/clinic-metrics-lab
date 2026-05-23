import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";
import type { ThemeMode } from "@/lib/theme";

const THEME_OPTIONS: Array<{ mode: ThemeMode; label: string; description: string }> = [
  { mode: "light", label: "Claro", description: "Superficies claras y contraste alto." },
  { mode: "dark", label: "Oscuro", description: "Vista clinica oscura con contraste reforzado." },
  { mode: "system", label: "Sistema", description: "Usa la preferencia del dispositivo." },
];

export function ThemeToggle() {
  const { mode, resolvedTheme, setTheme } = useTheme();
  const Icon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label={`Tema actual: ${getThemeLabel(mode)}`}
          title={`Tema actual: ${getThemeLabel(mode)}`}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Tema visual
        </DropdownMenuLabel>

        {THEME_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.mode}
            className="flex items-start gap-3 py-2"
            onClick={() => setTheme(option.mode)}
          >
            {option.mode === "light" && <Sun className="mt-0.5 h-4 w-4 text-muted-foreground" />}
            {option.mode === "dark" && <Moon className="mt-0.5 h-4 w-4 text-muted-foreground" />}
            {option.mode === "system" && <Monitor className="mt-0.5 h-4 w-4 text-muted-foreground" />}
            <span className="min-w-0">
              <span className="block text-[12px] font-medium">
                {option.label}
                {mode === option.mode ? " - activo" : ""}
              </span>
              <span className="block text-[10px] leading-4 text-muted-foreground">{option.description}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getThemeLabel(mode: ThemeMode) {
  return THEME_OPTIONS.find((option) => option.mode === mode)?.label ?? "Oscuro";
}
