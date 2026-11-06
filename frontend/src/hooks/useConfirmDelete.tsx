import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useTranslation } from 'react-i18next';

interface ConfirmDeleteOptions {
    name?: string;
    title?: string;
    message?:  string;
    confirmLabel?: string;
    color?: string;
    onConfirm: () => void;
}

export function useConfirmDelete() {
    const { t } = useTranslation();

    return ({ name, title, message, confirmLabel, color, onConfirm }: ConfirmDeleteOptions) => {
        const text =
        message ??
        (name
            ? t('common.confirmDelete.messageNamed', { name })
            : t('common.confirmDelete.message')
        );
        modals.openConfirmModal({
            title: title ?? t('common.confirmDelete.title'),
            centered: true,
            children: <Text size="sm">{text}</Text>,
            labels: { confirm: confirmLabel ?? t('common.delete'), cancel: t('common.cancel') },
            confirmProps: { color: color ?? 'red' },
            onConfirm,
        });
    };
}