import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Table,
  Badge,
  Container,
  Title,
  Loader,
  Text,
  Button,
  Group,
  Modal,
  TextInput,
  NumberInput,
  Select,
  Stack,
} from "@mantine/core";
import {  useNavigate } from "react-router-dom";
import { useDeals, useCreateDeal } from "../api/deals";
import { useClients } from "../api/clients";
import { useTranslation } from "react-i18next";

const STAGE_COLORS: Record<string, string> = {
  LEAD: "gray",
  QUALIFIED: "blue",
  PROPOSAL: "yellow",
  NEGOTIATION: "orange",
  WON: "green",
  LOST: "red",
};

const createDealSchema = z.object({
  title: z.string().min(1, "Title is required"),
  clientId: z.string().min(1, "Select a client"),
  value: z.number().min(0, "Value must be positive"),
});

type CreateDealFormData = z.infer<typeof createDealSchema>;

export function DealsListPage() {
  const { t } = useTranslation();
  const { data: deals, isLoading, isError } = useDeals();
  const { data: clients } = useClients();
  const createDeal = useCreateDeal();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDealFormData>({
    resolver: zodResolver(createDealSchema),
    defaultValues: { value: 0 },
  });


  const onSubmit = async (data: CreateDealFormData) => {
    await createDeal.mutateAsync(data);
    reset();
    setIsModalOpen(false);
  };

  if (isLoading) return <Loader mt="xl" mx="auto" display="block" />;
  if (isError)
    return (
      <Text c="red" ta="center" mt="xl">
        {t("failedToLoad")}
      </Text>
    );
  return (
    <Container mt="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>{t("deals.title")}</Title>       
          <Button onClick={() => setIsModalOpen(true)}>
            {t("deals.newDeal")}
          </Button>
      </Group>

      {deals && deals.length === 0 ? (
        <Text c="dimmed">{t("deals.noDeals")}</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("deals.table.title")}</Table.Th>
              <Table.Th>{t("deals.table.client")}</Table.Th>
              <Table.Th>{t("deals.table.stage")}</Table.Th>
              <Table.Th>{t("deals.table.value")}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {deals?.map((deal) => (
              <Table.Tr
                key={deal.id}
                onClick={() => navigate(`/deals/${deal.id}`)}
                style={{ cursor: "pointer" }}
              >
                <Table.Td>{deal.title}</Table.Td>
                <Table.Td>{deal.client.name}</Table.Td>
                <Table.Td>
                  <Badge color={STAGE_COLORS[deal.stage]}>
                    {t(`deals.stages.${deal.stage}`)}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {deal.currency} {deal.value}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("deals.newDeal")}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <TextInput
              label={t("deals.table.title")}
              error={errors.title?.message}
              {...register("title")}
            />

            <Controller
              name="clientId"
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  label={t("deals.table.client")}
                  data={
                    clients?.map((c) => ({ value: c.id, label: c.name })) ?? []
                  }
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  searchable
                />
              )}
            />

            <Controller
              name="value"
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  label={t("deals.table.value")}
                  min={0}
                  decimalScale={2}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Button type="submit" loading={createDeal.isPending} fullWidth>
              {t("deals.createDeal")}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
