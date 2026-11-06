import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Container,
  Title,
  Table,
  Button,
  Modal,
  TextInput,
  Textarea,
  Stack,
  Group,
  Text,
  Loader,
  ActionIcon,
} from "@mantine/core";
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  type Client,
} from "../api/clients";
import { RoleGate } from "../components/RoleGate";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useConfirmDelete } from "../hooks/useConfirmDelete";

const createClientSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t("clients.nameRequired")),
    industry: z.string().optional(),
    notes: z.string().optional(),
  });
type ClientFormData = z.infer<ReturnType<typeof createClientSchema>>;

export function ClientsPage() {
  const { t } = useTranslation();
  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const confirmDelete = useConfirmDelete();

  const clientSchema = useMemo(() => createClientSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const openCreateModal = () => {
    setEditingClient(null);
    reset({ name: "", industry: "", notes: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    reset({
      name: client.name,
      industry: client.industry ?? "",
      notes: client.notes ?? "",
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: ClientFormData) => {
    if (editingClient) {
      await updateClient.mutateAsync({ id: editingClient?.id, data });
    } else {
      await createClient.mutateAsync(data);
    }
    reset();
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const isSaving = createClient.isPending || updateClient.isPending;

  return (
    <Container mt="xl">
      <Group justify="spacebetween" mb="lg">
        <Title order={2}>{t('clients.title')}</Title>
        <RoleGate roles={["OWNER", "ADMIN"]}>
          <Button onClick={openCreateModal}>{t('clients.addClient')}</Button>
        </RoleGate>
      </Group>

      {isLoading ? (
        <Loader mt="xl" mx="auto" display="block" />
      ) : clients && clients.length === 0 ? (
        <Text c="dimmed">{t('clients.noClients')}</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('common.name')}</Table.Th>
              <Table.Th>{t('clients.industry')}</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {clients?.map((client) => (
              <Table.Tr key={client.id}>
                <Table.Td>{client.name}</Table.Td>
                <Table.Td>{client.industry ?? "-"}</Table.Td>
                <Table.Td>
                  <RoleGate roles={["OWNER", "ADMIN"]}>
                    <Group gap="xs" justify="flex-end">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => openEditModal(client)}
                      >
                        ✎
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => confirmDelete({ name: client.name, onConfirm: () => deleteClient.mutate(client.id) })}
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
        title={editingClient ? t('clients.editClient') : t('clients.addClient')}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <TextInput
              label={t('common.name')}
              error={errors.name?.message}
              {...register("name")}
            />
            <TextInput label={t('clients.industry')} {...register("industry")} />
            <Textarea label={t('common.notes')} {...register("notes")} />
            <Button type="submit" loading={isSaving} fullWidth>
              {editingClient ? t('saveChanges') : t('common.create')}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
