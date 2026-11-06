import z from "zod";
import {
  useContacts,
  useCreateContact,
  useDeleteContact,
  useUpdateContact,
  type Contact,
  type CreateContactPayload,
} from "../api/contacts";
import { useClients } from "../api/clients";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ActionIcon,
  Button,
  Container,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Table,
  TextInput,
  Title,
} from "@mantine/core";
import { RoleGate } from "../components/RoleGate";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useConfirmDelete } from "../hooks/useConfirmDelete";

const createContactSchema = (t: TFunction) =>
  z.object({
    fullName: z.string().min(1, t('contacts.nameRequired')),
    roleTitle: z.string().optional(),
    email: z.string().email(t('contacts.emailInvalid')).optional().or(z.literal("")),
    phone: z.string().optional(),
    clientId: z.string().min(1, t('contacts.selectClient')).optional(),
  });

const editContactSchema = (t: TFunction) =>
  createContactSchema(t).omit({ clientId: true });

type ContactFormData = z.infer<ReturnType<typeof createContactSchema>>;

export function ContactsPage() {
  const { t } = useTranslation();
  const { data: contacts, isLoading } = useContacts();
  const { data: clients } = useClients();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const confirmDelete = useConfirmDelete();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(editingContact ? editContactSchema(t) : createContactSchema(t)),
  });

  const openCreateModal = () => {
    setEditingContact(null);
    reset({ fullName: "", roleTitle: "", email: "", phone: "", clientId: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    reset({
      fullName: contact.fullName,
      roleTitle: contact.roleTitle ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: ContactFormData) => {
    if (editingContact) {
      const { clientId, ...editData } = data;
      await updateContact.mutateAsync({
        id: editingContact.id,
        data: editData,
      });
    } else {
      await createContact.mutateAsync(data as CreateContactPayload);
    }
    reset();
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const isSaving = createContact.isPending || updateContact.isPending;

  return (
    <Container mt="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>{t('contacts.title')}</Title>
        <RoleGate roles={["OWNER", "ADMIN"]}>
          <Button onClick={openCreateModal}>{t('contacts.addContact')}</Button>
        </RoleGate>
      </Group>

      {isLoading ? (
        <Loader mt="xl" mx="auto" display="block" />
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('common.name')}</Table.Th>
              <Table.Th>{t('contacts.role')}</Table.Th>
              <Table.Th>{t('contacts.client')}</Table.Th>
              <Table.Th>{t('common.email')}</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {contacts?.map((contact) => (
              <Table.Tr key={contact.id}>
                <Table.Td>{contact.fullName}</Table.Td>
                <Table.Td>{contact.roleTitle ?? "-"}</Table.Td>
                <Table.Td>{contact.client.name}</Table.Td>
                <Table.Td>{contact.email ?? "-"}</Table.Td>
                <Table.Td>
                  <RoleGate roles={["OWNER", "ADMIN"]}>
                    <Group gap="xs" justify="flex-end">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => openEditModal(contact)}
                      >
                        ✎
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => confirmDelete({ name: contact.fullName, onConfirm: () => deleteContact.mutate(contact.id) })}
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
        title={editingContact ? t('contacts.editContact') : t('contacts.addContact')}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <TextInput
              label={t('contacts.fullName')}
              error={errors.fullName?.message}
              {...register("fullName")}
            />
            <TextInput
              label={t('contacts.roleTitle')}
              placeholder={t('contacts.roleTitlePlaceholder')}
              {...register("roleTitle")}
            />
            <TextInput
              label={t('common.email')}
              error={errors.email?.message}
              {...register("email")}
            />
            <TextInput label={t('common.phone')} {...register("phone")} />
            {!editingContact && (
              <Controller
                name="clientId"
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    label={t('contacts.client')}
                    data={
                      clients?.map((c) => ({ value: c.id, label: c.name })) ??
                      []
                    }
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    searchable
                  />
                )}
              />
            )}
            <Button type="submit" loading={isSaving} fullWidth>
              {editingContact ? t('clients.saveChanges') : t('common.create')}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
