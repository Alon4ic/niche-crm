import { useState } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { TextInput, PasswordInput, Button, Paper, Title, Stack, Text, Anchor } from "@mantine/core";
import { Link, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginFormData } from "../schemas/auth.schemas";
import {useAuthStore } from '../stores/authStore';

export function LoginPage() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [serverError, setServerError] = useState<string | null>(null);

    const  {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data: LoginFormData) => {
        setServerError(null);
        try {
            await login(data.email, data.password);
            navigate('/deals');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Invalid email or password';
            setServerError(message);
        }
    };

    return (
      <Paper maw={400} mx="auto" mt="xl" p="xl" withBorder>
        <Title order={2} mb="lg">
          Log in
        </Title>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="you@ccompany.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              error={errors.password?.message}
              {...register("password")}
            />
            {serverError && (
              <Text c="red" size="sm">
                {serverError}
              </Text>
            )}
            <Button type="submit" loading={isSubmitting} fullWidth>
              Log in
            </Button>
            <Text size="sm" ta="center">
              Don&apos;t have an account?{" "}
              <Anchor component={Link} to="/register">
                Register
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    );
}