import {
  Card,
  Container,
  Group,
  Loader,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useFunnelAnalistics } from "../api/analytics";
import { useTranslation } from "react-i18next";

export function AnalyticsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useFunnelAnalistics();

  if (isLoading) return <Loader mt="xl" mx="auto" display="block" />;
  if (!data) return null;

  return (
    <Container mt="xl">
      <Title order={2} mb="lg">
        {t("analytics.title")}
      </Title>

      <Group mb="lg" grow>
        <Card withBorder>
          <Text size="sm" c="dimmed">
            {t("analytics.totalDeals")}
          </Text>
          <Text size="xl" fw={700}>
            {data.totalDeals}
          </Text>
        </Card>
        <Card withBorder>
          <Text size="sm" c="dimmed">
            {t("analytics.won")}
          </Text>
          <Text size="xl" fw={700}>
            {data.wonCount}
          </Text>
        </Card>
        <Card withBorder>
          <Text size="sm" c="dimmed">
            {t("analytics.lost")}
          </Text>
          <Text size="xl" fw={700}>
            {data.lostCount}
          </Text>
        </Card>
        <Card withBorder>
          <Text size="sm" c="dimmed">
            {t("analytics.winRate")}
          </Text>
          <Text size="xl" fw={700}>
            {data.winRatePercent !== null
              ? `${data.winRatePercent.toFixed(0)}%`
              : "-"}
          </Text>
        </Card>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("analytics.table.stage")}</Table.Th>
            <Table.Th>{t("analytics.table.deals")}</Table.Th>
            <Table.Th>{t("analytics.table.totalValue")}</Table.Th>
            <Table.Th>{t("analytics.table.avgDays")}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.stages.map((s) => (
            <Table.Tr key={s.stage}>
              <Table.Td>{t(`deals.stages.${s.stage}`)}</Table.Td>
              <Table.Td>{s.count}</Table.Td>
              <Table.Td>{s.totalValue.toFixed(2)}</Table.Td>
              <Table.Td>
                {s.avgDaysInStage !== null ? s.avgDaysInStage.toFixed(1) : "-"}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Container>
  );
}
