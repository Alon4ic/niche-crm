import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Container,
  Title,
  Table,
  Button,
  Modal,
  TextInput,
  NumberInput,
  Stack,
  Group,
  Loader,
  ActionIcon,
} from "@mantine/core";
import {
  useStockItems,
  useCreateStockItem,
  useUpdateStockItem,
  useDeleteStockItem,
  type StockItem,
} from "../api/stockItems";
import { RoleGate } from "../components/RoleGate";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useConfirmDelete } from "../hooks/useConfirmDelete";

const createSchema = (t: TFunction) =>
  z.object({
    sku: z.string().min(1, t("stockItems.skuRequired")),
    name: z.string().min(1, t("contacts.nameRequired")),
    unit: z.string().min(1, t("stockItems.unitRequired")),
    unitCost: z.number().min(0, t("stockItems.costMin")),
    quantityOnHand: z.number().min(0).optional(),
  });

type FormData = z.infer<ReturnType<typeof createSchema>>;

export function StockItemsPage() {
  const { t } = useTranslation();
  const { data: items, isLoading } = useStockItems();
  const createItem = useCreateStockItem();
  const updateItem = useUpdateStockItem();
  const deleteItem = useDeleteStockItem();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const confirmDelete = useConfirmDelete();

  const stockSchema = useMemo(() => createSchema(t), [t]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(stockSchema),
    defaultValues: { unitCost: undefined, quantityOnHand: undefined },
  });

  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      sku: "",
      name: "",
      unit: "",
      unitCost: undefined,
      quantityOnHand: undefined,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: StockItem) => {
    setEditingItem(item);
    reset({
      sku: item.sku,
      name: item.name,
      unit: item.unit,
      unitCost: Number(item.unitCost),
      quantityOnHand: Number(item.quantityOnHand),
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
       if (editingItem) {
      await updateItem.mutateAsync({ id: editingItem.id, data });
    } else {
      await createItem.mutateAsync(data);
    }
    } catch {
      return;
    }
    reset();
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const isSaving = createItem.isPending || updateItem.isPending;

  return (
    <Container mt="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>{t("stockItems.title")}</Title>
        <RoleGate roles={["OWNER", "ADMIN"]}>
          <Button onClick={openCreateModal}>{t("stockItems.addItem")}</Button>
        </RoleGate>
        <RoleGate roles={["OWNER", "ADMIN"]}>
          <Button component={Link} to="/import/stock-items" variant="outline">
            {t("nav.importFromFile")}
          </Button>
        </RoleGate>
      </Group>

      {isLoading ? (
        <Loader mt="xl" mx="auto" display="block" />
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("stockItems.sku")}</Table.Th>
              <Table.Th>{t("common.name")}</Table.Th>
              <Table.Th>{t("stockItems.unitCost")}</Table.Th>
              <Table.Th>{t("stockItems.quantityOnHand")}</Table.Th>
              <Table.Th>{t("stockItems.quantityReserved")}</Table.Th>
              <Table.Th>{t("stockItems.quantityAvailable")}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items?.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>{item.sku}</Table.Td>
                <Table.Td>{item.name}</Table.Td>
                <Table.Td>{item.unitCost}</Table.Td>
                <Table.Td>{item.quantityOnHand}</Table.Td>
                <Table.Td>{item.quantityReserved}</Table.Td>
                <Table.Td>{item.quantityAvailable}</Table.Td>
                <Table.Td>
                  <RoleGate roles={["OWNER", "ADMIN"]}>
                    <Group gap="xs" justify="flex-end">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => openEditModal(item)}
                      >
                        ✎
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() =>
                          confirmDelete({
                            name: item.name,
                            onConfirm: () => deleteItem.mutate(item.id),
                          })
                        }
                      >
                        ✕
                      </ActionIcon>
                    </Group>
                  </RoleGate>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingItem ? t("stockItems.editItem") : t("stockItems.addStockItem")
        }
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <TextInput
              label={t("stockItems.sku")}
              error={errors.sku?.message}
              {...register("sku")}
            />
            <TextInput
              label={t("common.name")}
              error={errors.name?.message}
              {...register("name")}
            />
            <TextInput
              label={t("stockItems.unit")}
              placeholder="pcs, kg, m, ..."
              error={errors.unit?.message}
              {...register("unit")}
            />
            <Controller
              name="unitCost"
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  label={t("stockItems.unitCost")}
                  placeholder="0.00"
                  min={0}
                  decimalScale={2}
                  clampBehavior="none"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="quantityOnHand"
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  label={t("stockItems.quantityOnHand")}
                  min={0}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Button type="submit" loading={isSaving} fullWidth>
              {editingItem ? t("clients.saveChanges") : t("common.create")}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
