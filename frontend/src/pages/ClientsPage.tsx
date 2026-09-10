import { useState } from "react";
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
} from "@mantine/core";
import { useClients, useCreateClient } from "../api/clients";

const createClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  industry: z.string().optional(),
  notes: z.string().optional(),
});
type CreateClientFormData = z.infer<typeof createClientSchema>;

export function ClientsPage() {
  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClientFormData>({
    resolver: zodResolver(createClientSchema),
  });

  const onSubmit = async (data: CreateClientFormData) => {
    await createClient.mutateAsync(data);
    reset();
    setIsModalOpen(false);
  };

  return (
    <Container mt="xl">
      <Group justify="spacebetween" mb="lg">
        <Title order={2}>Clients</Title>
        <Button onClick={() => setIsModalOpen(true)}>Add client</Button>
      </Group>

      {isLoading ? (
        <Loader mt="xl" mx="auto" display="block" />
      ) : clients && clients.length === 0 ? (
        <Text c="dimmed">No clients yet.</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Industry</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {clients?.map((client) => (
              <Table.Tr key={client.id}>
                <Table.Td>{client.name}</Table.Td>
                <Table.Td>{client.industry ?? "-"}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add client"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <TextInput
              label="Name"
              error={errors.name?.message}
              {...register("name")}
            />
            <TextInput label="Industry" {...register("industry")} />
            <Textarea label="Notes" {...register("notes")} />
            <Button type="submit" loading={createClient.isPending} fullWidth>
              Create
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
