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
import { Link, useNavigate } from "react-router-dom";
import { useDeals, useCreateDeal } from "../api/deals";
import { useClients } from "../api/clients";
import { useAuthStore } from "../stores/authStore";

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
  const { data: deals, isLoading, isError } = useDeals();
  const { data: clients } = useClients();
  const createDeal = useCreateDeal();
  const logout = useAuthStore((state) => state.logout);
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const onSubmit = async (data: CreateDealFormData) => {
    await createDeal.mutateAsync(data);
    reset();
    setIsModalOpen(false);
  };

  if (isLoading) return <Loader mt="xl" mx="auto" display="block" />;
  if (isError)
    return (
      <Text c="red" ta="center" mt="xl">
        Failed to load deals
      </Text>
    );
  return (
    <Container mt="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Deals</Title>
        <Group>
          <Button component={Link} to="/clients" variant="subtle">
            Clients
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>New deal</Button>
          <Button variant="subtle" onClick={handleLogout}>
            Log out
          </Button>
        </Group>
      </Group>

      {deals && deals.length === 0 ? (
        <Text c="dimmed">No deals yet.</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Client</Table.Th>
              <Table.Th>Stage</Table.Th>
              <Table.Th>Value</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {deals?.map((deal) => (
              <Table.Tr key={deal.id}>
                <Table.Td>{deal.title}</Table.Td>
                <Table.Td>{deal.client.name}</Table.Td>
                <Table.Td>
                  <Badge color={STAGE_COLORS[deal.stage]}>{deal.stage}</Badge>
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
        title="New deal"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <TextInput
              label="Title"
              error={errors.title?.message}
              {...register("title")}
            />

            <Controller
              name="clientId"
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  label="Client"
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
                  label="Value"
                  min={0}
                  decimalScale={2}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Button type="submit" loading={createDeal.isPending} fullWidth>
              Create deal
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
