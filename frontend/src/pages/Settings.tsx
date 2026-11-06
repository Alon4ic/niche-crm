import { useEffect, useState } from "react";
import { Button, Card, Container, Loader, NumberInput, Stack, Title } from '@mantine/core';
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { useSettings, useUpdateSettings } from '../api/settings';

export function SettingsPage() {
    const { t } = useTranslation();
    const { data, isLoading } = useSettings();
    const updateSettings = useUpdateSettings();
    const [days, setDays] = useState<number | string>('');

    useEffect(() => {
        if (data) setDays(data.returnWindowDays);
    }, [data]);

    if (isLoading) return <Loader mt="xl" mx="auto" display="block" />;

    const value = Number(days);
    const isValid = days !== '' && Number.isInteger(value) && value >= 0 && value <= 365;

    const handleSave = async () => {
        if (!isValid) return;
        try {
            await updateSettings.mutateAsync({ returnWindowDays: value });
        } catch {
            return;
        }
        notifications.show({ color: 'green', message: t('settings.saved') });
    };

    return (
        <Container mt="xl" maw={500}>
            <Title order={2} mb="lg">{t('settings.title')}</Title>
            <Card withBorder>
                <Stack>
                    <NumberInput
                        label={t('settings.returnWindow')}
                        description={t('settings.returnWindowHint')}
                        min={0}
                        max={365}
                        allowDecimal={false}
                        value={days}
                        onChange={setDays}
                    />
                    <Button onClick={handleSave} loading={updateSettings.isPending} disabled={!isValid}>
                        {t('settings.save')}
                    </Button>
                </Stack>
            </Card>
        </Container>
    )
}