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
import { apiClient, ApiError } from "../lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const registerUser = useAuthStore((state) => state.register);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: regInfo } = useQuery({
    queryKey: ["registration-info"],
    queryFn: () =>
      apiClient.get<{ inviteRequired: boolean }>("/auth/registration-info"),
    staleTime: Infinity,
  });

  const registerSchema = useMemo(() => createRegisterSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await registerUser({...data, inviteCode: data.inviteCode?.trim() || undefined});
      navigate("/deals");
    } catch (error) {
     if (error instanceof ApiError) {
       if (error.code = "INVALID_INVITE_CODE") {
        setError("inviteCode", { message: t("errors.codes.INVALID_INVITE_CODE") });
        return;
       }
       if (error.status === 409) {
        setError("email", { message: t("auth.register.emailTaken") });
        return;
       }
       if (error.status === 429) {
        setServerError(t("errors.toManyRequests"));
        return;
       }
     }
     setServerError(t("errors.generic"));
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
          {regInfo?.inviteRequired && (
            <TextInput
              label={t("auth.register.inviteCode")}
              error={errors.inviteCode?.message}
              {...register("inviteCode")}
            />
          )}
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
