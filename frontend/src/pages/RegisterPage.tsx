import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextInput, PasswordInput, Button, Paper, Title, Stack, Text, Anchor } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, type RegisterFormData } from '../schemas/auth.schemas';
import { useAuthStore } from '../stores/authStore';

export function RegisterPage() {
    const navigate = useNavigate();
    const registerUser = useAuthStore((state) => state.register);
    const [serverError, setServerError] = useState<string | null>(null);

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
            navigate('/deals');
        } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Cold not create account. Email might already be registered.";
            setServerError(message);
        }
    };

    return (
        <Paper maw={400} mx="auto" mt="xl" p="xl" withBorder>
            <Title order={2} mb="lg">Create your workspace</Title>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Stack>
                    <TextInput
                        label="Company name"
                        placeholder="Acme Manufacturing"
                        error={errors.tenantName?.message}
                        {...register('tenantName')}
                    />
                    <TextInput
                        label="Email"
                        placeholder="you@company.com"
                        error={errors.email?.message}
                        {...register('email')}
                    />
                    <PasswordInput
                        label="Password"
                        placeholder="At least8 characters"
                        error={errors.password?.message}
                        {...register('password')}
                    />
                    {serverError && <Text c="red" size="sm">{serverError}</Text>}
                    <Button type="submit" loading={isSubmitting} fullWidth>
                        Create account
                    </Button>
                    <Text size="sm" ta="center">
                        Already have an account? <Anchor component={Link} to="/login">Log in</Anchor>
                    </Text>
                </Stack>
            </form>
        </Paper>
    )
}