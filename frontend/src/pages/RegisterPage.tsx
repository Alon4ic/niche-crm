import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Stack,
  Text,
  Anchor,
  Group,
} from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import {
  createRegisterSchema,
  type RegisterFormData,
} from "../schemas/auth.schemas";
import { useAuthStore } from "../stores/authStore";
import { useTranslation } from "react-i18next";
import { ApiError } from "../lib/apiClient";

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const registerUser = useAuthStore((state) => state.register);
  const [serverError, setServerError] = useState<string | null>(null);

  const registerSchema = useMemo(() => createRegisterSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await registerUser(data);
      navigate("/deals");
    } catch (error) {
      setServerError(
        error instanceof ApiError && error.status === 429
          ? t('errors.toManyRequests')
          : t('auth.login.invalidCredentials'),
      );
    }
  };

  return (
    <Paper maw={400} mx="auto" mt="xl" p="xl" withBorder>
      <Title order={2} mb="lg">
        {t("auth.register.title")}
      </Title>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <TextInput
            label={t("auth.register.companyName")}
            placeholder={t("auth.register.companyNamePlaceholder")}
            error={errors.tenantName?.message}
            {...register("tenantName")}
          />
          <Group grow align="flex-start">
            <TextInput label={t('common.firstName')} {...register('firstName')} />
            <TextInput label={t('common.lastName')} {...register('lastName')} />
          </Group>
          <TextInput
            label="Email"
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <PasswordInput
            label={t("common.password")}
            placeholder={t('auth.register.passwordPlaceholder')}
            error={errors.password?.message}
            {...register("password")}
          />
          {serverError && (
            <Text c="red" size="sm">
              {serverError}
            </Text>
          )}
          <Button type="submit" loading={isSubmitting} fullWidth>
            {t('auth.register.submit')}
          </Button>
          <Text size="sm" ta="center">
            {t('auth.register.haveAccount')}{" "}
            <Anchor component={Link} to="/login">
              {t('auth.register.loginLink')}
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Paper>
  );
}
