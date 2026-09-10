import React, {useState} from 'react';
import { useParams, Link } from 'react-router-dom';
import {useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Container, Title, Table, Button, Group, Text, Loader, Badge, Card, Select, NumberInput, Alert,
} from '@mantine/core';
import { useDeal, useDealCost, useAddBomItem, useReserveStock } from '../api/deals';
import { useStockItems} from '../api/stockItems';

const bomItemSchema = z.object({
  stockItemId: z.string().min(1, 'Select an item'),
  quantity: z.number().min(0.001, 'Quantity must be positive'),
});

type BomItemFormData = z.infer<typeof bomItemSchema>;


export function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dealId = id!;

  const { data: deal, isLoading } = useDeal(dealId);
  const { data: cost } = useDealCost(dealId);
  const { data: stockItems } = useStockItems();
  const addBomItem = useAddBomItem(dealId);
  const reserveStock = useReserveStock(dealId);
  const [reserveResult, setReserveResult] = useState<'success' | 'error' | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<BomItemFormData>({
    resolver: zodResolver(bomItemSchema),
    defaultValues: { quantity: 1 },
  });

  const onSubmitBomItem = async (data: BomItemFormData) => {
    await addBomItem.mutateAsync(data);
    reset();
  };

  const handleReserve = async () => {
    setReserveResult(null);
    try {
      await reserveStock.mutateAsync();
      setReserveResult('success');
    } catch {
      setReserveResult('error');
    }
  };

  if (isLoading) return <Loader mt="xl" mx="auto" display="block" />;
  if (!deal) return <Text c="red" ta="center" mt="xl">Deal not found</Text>;
  return (
    <Container mt="xl">
      <Button component={Link} to="/deals" variant="subtle" mb="mb">
        ← Back to deals
      </Button>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>{deal.title}</Title>
          <Text c="dimmed">{deal.client.name}</Text>
        </div>
        <Badge size="lg" color="blue">
          {deal.stage}
        </Badge>
      </Group>
      <Card withBorder mb="lg">
        <Title order={4} mb="sm">
          Bill of Materials
        </Title>
        {deal.bomItems.length === 0 ? (
          <Text c="dimmed" mb="md">
            No components added yet.
          </Text>
        ) : (
          <Table mb="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Item</Table.Th>
                <Table.Th>Quantity</Table.Th>
                <Table.Th>Unit cost (fixed)</Table.Th>
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
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {cost && (
          <Text fw={700} mb="md">
            Totaal cost: {deal.currency} {cost.totalCost.toFixed(2)}
          </Text>
        )}

        <form onSubmit={handleSubmit(onSubmitBomItem)}>
          <Group align="flex-end">
            <Controller
              name="stockItemId"
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  label="Stock item"
                  data={
                    stockItems?.map((s) => ({
                      value: s.id,
                      label: `${s.name} (${s.sku})`,
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
                  label="Quantity"
                  min={0.001}
                  decimalScale={3}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Button type="submit" loading={addBomItem.isPending}>
              Add
            </Button>
          </Group>
        </form>
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          Sock reservation
        </Title>
        {reserveResult === "success" && (
          <Alert color="green" mb="md">
            Stock reserved successfully
          </Alert>
        )}
        {reserveResult === "error" && (
          <Alert color="red" mb="md">
            Could not reserve stock - check available quantities.
          </Alert>
        )}
        <Button
          onClick={handleReserve}
          loading={reserveStock.isPending}
          disabled={deal.bomItems.length === 0}
        >Reserve stock</Button>
      </Card>
    </Container>
  );
}
