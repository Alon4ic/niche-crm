import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

export function ThemeToggle() {
    const { t } = useTranslation();
    const { setColorScheme } = useMantineColorScheme();
    const computed = useComputedColorScheme("light", { getInitialValueInEffect: true });
    const next = computed === "dark" ? "light" : "dark";
    return (
        <ActionIcon
            variant="default"
            size="lg"
            onClick={() => setColorScheme(next)}
            aria-label={t("common.toggleTheme")}
        >
            {computed === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
        </ActionIcon>
    )
}
