import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Stack,
  Text,
  Anchor,
} from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import { createLoginSchema, type LoginFormData } from "../schemas/auth.schemas";
import { useAuthStore } from "../stores/authStore";
import { ApiError } from "../lib/apiClient";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [serverError, setServerError] = useState<string | null>(null);

  const loginSchema = useMemo(() => createLoginSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      navigate("/deals");
    } catch (error) {
      setServerError(
        error instanceof ApiError && error.status === 429
          ? t('errors.tooManyRequests')
          : t('auth.login.invalidCredentials'),
      );
    }
  };

  return (
    <Paper maw={400} mx="auto" mt="xl" p="xl" withBorder>
      <Title order={2} mb="lg">
        {t("auth.login.title")}
      </Title>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <TextInput
            label={t("common.email")}
            placeholder="you@ccompany.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <PasswordInput
            label={t("common.password")}
            placeholder={t('auth.login.placeholderPassword')}
            error={errors.password?.message}
            {...register("password")}
          />
          {serverError && (
            <Text c="red" size="sm">
              {serverError}
            </Text>
          )}
          <Button type="submit" loading={isSubmitting} fullWidth>
            {t("auth.login.submit")}
          </Button>
          <Text size="sm" ta="center">
            {t("auth.login.noAccount")}
            {" "}
            <Anchor component={Link} to="/register">
              {t("auth.login.registerLink")}
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Paper>
  );
}
