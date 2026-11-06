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
  PasswordInput,
  Select,
  Stack,
  Group,
  Loader,
  Badge,
} from "@mantine/core";
import { useUsers, useCreateUser } from "../api/users";
import { RoleGate } from "../components/RoleGate";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

const createUserSchema = (t: TFunction) =>
  z.object({
    email: z.string().email(t("auth.register.emailInvalid")),
    password: z.string().min(8, t("auth.register.passwordMin")),
    role: z.enum(["ADMIN", "MEMBER"], { message: t("users.roleRequired") }),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  });

type FormData = z.infer<ReturnType<typeof createUserSchema>>;

export function UsersPage() {
  const { t } = useTranslation();
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userSchema = useMemo(() => createUserSchema(t), [t]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(userSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createUser.mutateAsync(data);
    } catch {
      return;
    }
    reset();
    setIsModalOpen(false);
  };

  return (
    <Container mt="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>{t("users.title")}</Title>
        <RoleGate roles={["OWNER"]}>
          <Button onClick={() => setIsModalOpen(true)}>
            {t("users.invite")}
          </Button>
        </RoleGate>
      </Group>

      {isLoading ? (
        <Loader mt="xl" mx="auto" display="block" />
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('common.name')}</Table.Th>
              <Table.Th>{t("common.email")}</Table.Th>
              <Table.Th>{t("users.role")}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users?.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>
                  {[user.firstName, user.lastName].filter(Boolean).join(' ') || '-'}
                </Table.Td>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>
                  <Badge>{t(`users.roles.${user.role}`)}</Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("users.inviteTitle")}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <Group grow align="flex-start">
              <TextInput label={t('common.firstName')} {...register('firstName')} />
              <TextInput label={t('common.lastName')} {...register('lastName')} />
            </Group>
            <TextInput
              label={t("common.email")}
              error={errors.email?.message}
              {...register("email")}
            />
            <PasswordInput
              label={t("common.password")}
              error={errors.password?.message}
              {...register("password")}
            />
            <Controller
              name="role"
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  label={t("users.role")}
                  data={[
                    { value: "ADMIN", label: t("users.roles.ADMIN") },
                    { value: "MEMBER", label: t("users.roles.MEMBER") },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Button type="submit" loading={createUser.isPending} fullWidth>
              {t("common.create")}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
