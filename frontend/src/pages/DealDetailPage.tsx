import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Container,
  Title,
  Table,
  Button,
  Group,
  Text,
  Loader,
  Badge,
  Card,
  Select,
  NumberInput,
  Stack,
  ActionIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  useDeal,
  useDealCost,
  useAddBomItem,
  useReserveStock,
  downloadQuotePdf,
  useUpdateDealStage,
  useAddDealContact,
  useRemoveDealContact,
  type DealStage,
  useRemoveBomItem,
  useReleaseReservation,
} from "../api/deals";
import { useStockItems } from "../api/stockItems";
import { useContacts } from "../api/contacts";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useConfirmDelete } from "../hooks/useConfirmDelete";
import { ReturnsCard } from "../components/ReturnsCard";

const STAGES: DealStage[] = [
  "LEAD",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
];

const createBomItemSchema = (t: TFunction) =>
  z.object({
    stockItemId: z.string().min(1, t("deals.bom.selectItem")),
    quantity: z.number().min(0.001, t("deals.bom.quantityPositive")),
  });

type BomItemFormData = z.infer<ReturnType<typeof createBomItemSchema>>;

export function DealDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const dealId = id!;

  const { data: deal, isLoading } = useDeal(dealId);
  const { data: cost } = useDealCost(dealId);
  const { data: stockItems } = useStockItems();
  const { data: clientContacts } = useContacts(deal?.client.id);

  const addBomItem = useAddBomItem(dealId);
  const reserveStock = useReserveStock(dealId);
  const removeBomItem = useRemoveBomItem(dealId);
  const releaseReservation = useReleaseReservation(dealId);
  const updateStage = useUpdateDealStage(dealId);
  const addDealContact = useAddDealContact(dealId);
  const removeDealContact = useRemoveDealContact(dealId);
  const confirmDelete = useConfirmDelete();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  );

  const bomItemSchema = useMemo(() => createBomItemSchema(t), [t]);

  const { control, handleSubmit, reset } = useForm<BomItemFormData>({
    resolver: zodResolver(bomItemSchema),
    defaultValues: { quantity: 1 },
  });
  const selectedStockId = useWatch({ control, name: "stockItemId" });
  const enteredQty = useWatch({ control, name: "quantity" });
  const selectedStock = stockItems?.find((s) => s.id === selectedStockId);
  const available = selectedStock
    ? Number(selectedStock.quantityAvailable)
    : null;
  const shortage =
    available !== null && typeof enteredQty === "number"
      ? enteredQty - available
      : 0;

  const onSubmitBomItem = async (data: BomItemFormData) => {
    try {
      await addBomItem.mutateAsync(data);
    } catch {
      return;
    }
    reset();
  };

  const handleReserve = async () => {
    try {
      await reserveStock.mutateAsync();
      notifications.show({
        color: "green",
        message: t("deals.reservation.success"),
      });
    } catch {}
  };

  if (isLoading) return <Loader mt="xl" mx="auto" display="block" />;
  if (!deal) {
    return (
      <Text c="red" ta="center" mt="xl">
        {t("deals.notFound")}
      </Text>
    );
  }
  const isReserved = deal.stockReservations.some(
    (r) => r.status === "RESERVED",
  );
  const isFulfilled = deal.stockReservations.some(
    (r) => r.status === "FULFILLED",
  );
  const isWon = deal.stage === "WON";
  const isClosed = isWon || deal.stage === "LOST";
  const isLocked = isReserved || isWon;
  return (
    <Container mt="xl">
      <Button component={Link} to="/deals" variant="subtle" mb="md">
        {t("deals.backToDeals")}
      </Button>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>{deal.title}</Title>
          <Text c="dimmed">{deal.client.name}</Text>
        </div>
        <Select
          data={STAGES.map((s) => ({
            value: s,
            label: t(`deals.stages.${s}`),
          }))}
          value={deal.stage}
          disabled={isFulfilled}
          allowDeselect={false}
          onChange={(value) => {
            if (!value || value === deal.stage) return;
            const stage = value as DealStage;
            if (stage === "WON") {
              confirmDelete({
                title: t("deals.stageChange.confirmWonTitle"),
                message: t("deals.stageChange.confirmWon"),
                confirmLabel: t("deals.stageChange.markWon"),
                color: "green",
                onConfirm: () => updateStage.mutate(stage),
              });
            } else {
              updateStage.mutate(stage);
            }
          }}
          w={200}
        />
      </Group>
      <Card withBorder mb="lg">
        <Title order={4} mb="sm">
          {t("deals.bom.title")}
        </Title>
        {deal.bomItems.length === 0 ? (
          <Text c="dimmed" mb="md">
            {t("deals.bom.noComponents")}
          </Text>
        ) : (
          <Table mb="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("deals.bom.item")}</Table.Th>
                <Table.Th>{t("deals.bom.quantity")}</Table.Th>
                <Table.Th>{t("deals.bom.unitCostFixed")}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {deal.bomItems.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>
                    {item.stockItem.name} ({item.stockItem.sku})
                  </Table.Td>
                  <Table.Td>{item.quantity}</Table.Td>
                  <Table.Td>{item.unitCostSnapshot}</Table.Td>
                  <Table.Td>
                    {!isLocked && (
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() =>
                          confirmDelete({
                            name: item.stockItem.name,
                            onConfirm: () => removeBomItem.mutate(item.id),
                          })
                        }
                      >
                        ✕
                      </ActionIcon>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {cost && (
          <Text fw={700} mb="md">
            {t("deals.bom.totalCost")}: {deal.currency}{" "}
            {cost.totalCost.toFixed(2)}
          </Text>
        )}

        {isLocked && (
          <Text size="sm" c="dimed" mb="xs">
            {isWon ? t("deals.bom.lockedWon") : t("deals.bom.locked")}
          </Text>
        )}

        <form onSubmit={handleSubmit(onSubmitBomItem)}>
          <Group align="flex-end">
            <Controller
              name="stockItemId"
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  label={t("deals.bom.item")}
                  placeholder={t("deals.bom.selectItem")}
                  data={
                    stockItems?.map((s) => ({
                      value: s.id,
                      label: `${s.name} (${s.sku}) ${s.quantityAvailable}`,
                    })) ?? []
                  }
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  style={{ flex: 1 }}
                  searchable
                />
              )}
            />

            <Controller
              name="quantity"
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  label={t("deals.bom.quantity")}
                  min={0.001}
                  decimalScale={3}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Button
              type="submit"
              loading={addBomItem.isPending}
              disabled={isLocked}
            >
              {t("deals.bom.add")}
            </Button>
            {available !== null && (
              <Text size="sm" c={shortage > 0 ? "orange" : "dimmed"}>
                {t("deals.bom.available", { count: available })}
                {shortage > 0 && (
                  <>
                    <br />
                    {t("deals.bom.shortage", { count: shortage })}
                  </>
                )}
              </Text>
            )}
          </Group>
        </form>
      </Card>

      <Card withBorder mb="lg">
        <Title order={4} mb="sm">
          {t("deals.contactsSection.title")}
        </Title>
        {deal.dealContacts.length === 0 ? (
          <Text c="dimmed" mb="md">
            {t("deals.contactsSection.noContacts")}
          </Text>
        ) : (
          <Stack mb="md">
            {deal.dealContacts.map((dc) => (
              <Group key={dc.id} justify="space-between">
                <Text>
                  {dc.contact.fullName} {dc.roleInDeal && `- ${dc.roleInDeal}`}
                </Text>
                <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={() =>
                    confirmDelete({
                      message: t("deals.contactsSection.confirmUnlink", {
                        name: dc.contact.fullName,
                      }),
                      confirmLabel: t("deals.contactsSection.unlink"),
                      onConfirm: () => removeDealContact.mutate(dc.contact.id),
                    })
                  }
                >
                  ✕
                </ActionIcon>
              </Group>
            ))}
          </Stack>
        )}

        <Group align="flex-end">
          <Select
            label={t("contacts.contact")}
            placeholder={t("deals.contactsSection.selectContact")}
            data={
              clientContacts?.map((c) => ({
                value: c.id,
                label: c.fullName,
              })) ?? []
            }
            value={selectedContactId}
            onChange={setSelectedContactId}
            style={{ flex: 1 }}
            searchable
          />
          <Button
            onClick={() => {
              if (selectedContactId) {
                addDealContact.mutate({ contactId: selectedContactId });
                setSelectedContactId(null);
              }
            }}
          >
            {t("deals.contactsSection.link")}
          </Button>
        </Group>
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          {t("deals.reservation.title")}
        </Title>

        {isFulfilled ? (
          <Badge color="teal" size="lg">
            {t("deals.reservation.deducted")}
          </Badge>
        ) : isReserved ? (
          <Group>
            <Badge color="green" size="lg">
              {t("deals.reservation.reservedBadge")}
            </Badge>
            <Button
              variant="outline"
              color="red"
              loading={releaseReservation.isPending}
              onClick={() =>
                confirmDelete({
                  message: t("deals.reservation.confirmRelease"),
                  confirmLabel: t("deals.reservation.release"),
                  onConfirm: () => releaseReservation.mutate(),
                })
              }
            >
              {t("deals.reservation.release")}
            </Button>
          </Group>
        ) : (
          <>
            <Button
              onClick={handleReserve}
              loading={reserveStock.isPending}
              disabled={deal.bomItems.length === 0 || isClosed}
            >
              {t("deals.reservation.action")}
            </Button>
            {isClosed && (
              <Text size="sm" c="dimmed" mt="xs">
                {t("deals.reservation.closedHint")}
              </Text>
            )}
          </>
        )}
      </Card>

      {isFulfilled && <ReturnsCard dealId={dealId} />}
      <Button
        mt="lg"
        variant="outline"
        onClick={() => downloadQuotePdf(dealId, deal.title)}
      >
        {t("deals.quote.download")}
      </Button>
    </Container>
  );
}
