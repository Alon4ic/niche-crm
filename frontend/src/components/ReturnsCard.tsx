import { useState } from "react";
import { Alert, Button, Card, Group, Loader, Modal, NumberInput, Select, Stack, Table, Text, Textarea, Title, } from '@mantine/core';
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { RoleGate } from "./RoleGate";
import { useCreateReturn, useDealReturns, type ReturnDisposition } from "../api/returns";

export function ReturnsCard({ dealId }: {dealId: string }) {
    const { t, i18n } = useTranslation();
    const { data, isLoading, isError } = useDealReturns(dealId);
    const createReturn = useCreateReturn(dealId);
    
    const [isOpen, setIsOpen] = useState(false);
    const[qty, setQty] = useState<Record<string, number | string>>({});
    const [disposition, setDisposition] = useState<Record<string, ReturnDisposition>>({});
    const [reason, setReason] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    if(!data) return null;

    const returnableLines = data.lines.filter((l) => Number(l.returnable) > 0);
    const deadlineText = data.deadline
        ? new Date(data.deadline).toLocaleDateString(i18n.language)
        : '';
    const dispositionLabel = (d: ReturnDisposition) =>
        d === 'RESTOCK' ? t('returns.restock') : t('returns.writeOff');

    const handleSubmit = async () => {
        const items = returnableLines
            .map((l) => ({
                stockItemId: l.stockItemId,
                quantity: Number(qty[l.stockItemId] || 0),
                disposition: disposition[l.stockItemId] ?? ('RESTOCK' as ReturnDisposition),
            }))
            .filter((i) => i.quantity > 0);

        if (items.length === 0) {
            setFormError(t('returns.enterQuantity'));
            return;
        }
        setFormError(null);

        try {
            await createReturn.mutateAsync({ reason: reason.trim() || undefined, items });
        } catch {
            return;
        }
        notifications.show({ color: 'green', message: t('returns.registered') });
        setIsOpen(false);
        setQty({});
        setDisposition({});
        setReason('');
    };

    if (isLoading) return <Loader mt="lg" />;
    if (isError || !data) {
        return (
            <Alert color="red" mt="lg">
                {t('returns.loadFailed')}
            </Alert>
        )
    }
    
    return (
      <Card withBorder mt="lg">
        <Group justify="space-between" mb="sm">
          <Title order={4}>{t("returns.title")}</Title>
          <RoleGate roles={["OWNER", "ADMIN"]}>
            <Button
              variant="outline"
              disabled={!data.eligible}
              onClick={() => setIsOpen(true)}
            >
              {t("returns.register")}
            </Button>
          </RoleGate>
        </Group>

        {data.eligible ? (
          <Text size="sm" c="dimmed" mb="md">
            {t("returns.windowInfo", {
              days: data.windowDays,
              date: deadlineText,
            })}
          </Text>
        ) : (
          data.blockedReason && (
            <Alert color="gray" mb="md">
              {t(`errors.codes.${data.blockedReason}`)}
            </Alert>
          )
        )}

        <Table mb="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("common.name")}</Table.Th>
              <Table.Th>{t("returns.delivered")}</Table.Th>
              <Table.Th>{t("returns.returned")}</Table.Th>
              <Table.Th>{t("returns.returnable")}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.lines.map((l) => (
              <Table.Tr key={l.stockItemId}>
                <Table.Td>
                  {l.name} ({l.sku})
                </Table.Td>
                <Table.Td>
                  {l.delivered} {l.unit}
                </Table.Td>
                <Table.Td>
                  {l.returned} {l.unit}
                </Table.Td>
                <Table.Td>
                  {l.returnable} {l.unit}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Title order={5} mb="xs">
          {t("returns.history")}
        </Title>
        {data.returns.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t("returns.noReturns")}
          </Text>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("returns.date")}</Table.Th>
                <Table.Th>{t("returns.items")}</Table.Th>
                <Table.Th>{t("returns.reason")}</Table.Th>
                <Table.Th>{t("returns.acceptedBy")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.returns.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>
                    {new Date(r.createdAt).toLocaleDateString(i18n.language)}
                  </Table.Td>
                  <Table.Td>
                    {r.items.map((i) => (
                      <Text key={i.id} size="sm">
                        {i.stockItem.name} * {i.quantity} - {dispositionLabel(i.disposition)}
                      </Text>
                    ))}
                  </Table.Td>
                  <Table.Td>{r.reason ?? '-'}</Table.Td>
                  <Table.Td>{r.createdBy?.email ?? '-'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        <Modal opened={isOpen} onClose={() => setIsOpen(false)} title={t('returns.modalTitle')} size="lg">
            <Stack>
                {returnableLines.map((l) => (
                    <Group key={l.stockItemId} align="flex-end" grow>
                        <Text size="sm">
                            {l.name} {l.sku}
                            <Text span c="dimmed"> - {t('returns.returnable')}: {l.returnable} {l.unit}</Text>
                        </Text>
                        <NumberInput
                            label={t('returns.quantity')}
                            min={0}
                            max={Number(l.returnable)}
                            decimalScale={3}
                            placeholder="0"
                            value={qty[l.stockItemId] ?? ''}
                            onChange={(v) => setQty((prev) => ({ ...prev, [l.stockItemId]: v }))}
                        />
                        <Select
                            label={t('returns.condition')}
                            allowDeselect={false}
                            data={[
                                { value: 'RESTOCK', label: t('returns.restock') },
                                { value: 'WRITE_OFF', label: t('returns.writeOff') },
                            ]}
                            value={disposition[l.stockItemId] ?? 'RESTOCK'}
                            onChange={(v) =>
                                v && setDisposition((prev) => ({ ...prev, [l.stockItemId]: v as ReturnDisposition }))
                            }
                        />
                    </Group>
                ))}

                <Textarea
                    label={t('returns.reason')}
                    value={reason}
                    onChange={(e) => setReason(e.currentTarget.value)}
                    maxLength={500}
                />

                {formError && <Text c="red" size="sm">{formError}</Text>}

                <Button onClick={handleSubmit} loading={createReturn.isPending}>
                    {t('returns.accept')}
                </Button>
            </Stack>
        </Modal>
      </Card>
    );
}