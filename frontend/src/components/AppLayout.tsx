import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDisclosure } from "@mantine/hooks";
import {
  AppShell,
  Avatar,
  Burger,
  Button,
  Drawer,
  Group,
  Menu,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useAuthStore } from "../stores/authStore";
import { useCurrentRole } from "../hooks/useCurrentRole";
import { useMe } from "../api/auth";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { APP_NAME } from "../config/brand";
import { ThemeToggle } from "./ThemeToggle";

interface NavItem {
  to: string;
  labelKey: string;
  roles?: string[];
  alsoActiveFor?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/deals", labelKey: "nav.deals" },
  { to: "/clients", labelKey: "nav.clients" },
  { to: "/contacts", labelKey: "nav.contacts" },
  {
    to: "/stock-items",
    labelKey: "nav.stockItems",
    alsoActiveFor: ["import/stock-items"],
  },
  { to: "/analytics", labelKey: "nav.analytics" },
  { to: "/users", labelKey: "nav.team", roles: ["OWNER", "ADMIN"] },
  { to: "/settings", labelKey: "nav.settings", roles: ["OWNER"] },
];

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ru: "Русский",
  uk: "Українська",
  de: "Deutsch",
  it: "Italiano",
};

export function AppLayout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const role = useCurrentRole();
  const { data: me } = useMe();
  const logout = useAuthStore((state) => state.logout);
  const [drawerOpened, { toggle, close }] = useDisclosure(false);

  const items = NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)));

  const isActive = (item: NavItem) =>
  [item.to, ...(item.alsoActiveFor ?? [])].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const fullName = [me?.firstName, me?.lastName].filter(Boolean).join(' ');
  const displayName = fullName || me?.email || '';
    const initials = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join('');
    const roleLabel = role ? t(`users.roles.${role}`) : '';

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const renderNavButtons = (vertical: boolean, onNavigate?: () => void) =>
        items.map((item) => (
            <Button
                key={item.to}
                component={Link}
                to={item.to}
                size="sm"
                variant={isActive(item) ? 'light' : 'subtle'}
                fullWidth={vertical}
                justify={vertical ? 'flex-start' : 'center'}
                onClick={onNavigate}
            >
                {t(item.labelKey)}
            </Button>
        ));

        return (
          <AppShell header={{ height: 60 }} padding="md">
            <AppShell.Header>
              <Group h="100%" px="md" justify="space-between" wrap="nowrap">
                <Group gap="md" wrap="nowrap">
                  <Burger
                    opened={drawerOpened}
                    onClick={toggle}
                    hiddenFrom="md"
                    size="sm"
                    aria-label={t("header.menu")}
                  />
                  <Text
                    component={Link}
                    to="/deals"
                    fw={800}
                    size="xl"
                    c="blue"
                    style={{ textDecoration: "none" }}
                  >
                    {APP_NAME}
                  </Text>
                  <Group gap={4} visibleFrom="md" wrap="nowrap">
                    {renderNavButtons(false)}
                  </Group>
                </Group>

                <Group gap="xs" wrap="nowrap">
                  <ThemeToggle />
                  <Menu position="bottom-end" width={240}>
                    <Menu.Target>
                      <UnstyledButton>
                        <Group gap="xs" wrap="nowrap">
                          <Avatar color="blue" radius="xl">
                            {initials}
                          </Avatar>
                          <Stack gap={0} visibleFrom="sm">
                            <Text size="sm" c="dimmed" fw={500} lh={1.3}>
                              {displayName}
                            </Text>
                            <Text size="xs" c="dark" lh={1.3}>
                              {roleLabel}
                            </Text>
                          </Stack>
                        </Group>
                      </UnstyledButton>
                    </Menu.Target>

                    <Menu.Dropdown>
                      {me?.tenant && (
                        <>
                          <Menu.Label>{me.tenant.name}</Menu.Label>
                          <Text size="xs" c="dimmed" px="sm" pb="xs">
                            {me.email}
                          </Text>
                          <Menu.Divider />
                        </>
                      )}
                      <Menu.Label>{t("header.language")}</Menu.Label>
                      {SUPPORTED_LANGUAGES.map((code) => (
                        <Menu.Item
                          key={code}
                          onClick={() => i18n.changeLanguage(code)}
                          rightSection={
                            i18n.resolvedLanguage === code ? "✓" : null
                          }
                        >
                          {LANGUAGE_NAMES[code]}
                        </Menu.Item>
                      ))}
                      <Menu.Divider />
                      <Menu.Item color="red" onClick={handleLogout}>
                        {t("common.logout")}
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Group>
            </AppShell.Header>

            <Drawer
              opened={drawerOpened}
              onClose={close}
              title={APP_NAME}
              size="xs"
            >
              <Stack gap="xs">{renderNavButtons(true, close)}</Stack>
            </Drawer>

            <AppShell.Main>
              <Outlet />
            </AppShell.Main>
          </AppShell>
        );
}
