import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Container, Title, Table, Button, Modal, TextInput, NumberInput, Stack, Group, Text, Loader,
    TableTbody, } from '@mantine/core';
import { Controller } from 'react-hook-form';
import { useStockItems, useCreateStockItem } from '../api/stockItems';

const schema = z.object({
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().min(1, 'Name is required'),
    unit: z.string().min(1, 'Unit is required'),
    unitCost: z.number().min(0),
    quantityOnHand: z.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

export function StockItemsPage() {
    const { data: items, isLoading } = useStockItems();
    const createItem = useCreateStockItem();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {control, register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {unitCost: 0, quantityOnHand: 0 },
    });

    const onSubmit = async (data: FormData) => {
        await createItem.mutateAsync(data);
        reset();
        setIsModalOpen(false);
    };

    return (
        <Container mt="xl">
            <Group justify="space-between" mb="lg">
                <Title order={2}>Stock items</Title>
                <Button onClick={() => setIsModalOpen(true)}>Add item</Button>
            </Group>

            {isLoading ? (
                <Loader mt="xl" mx="auto" display="block" />
            ) : (
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>SKU</Table.Th>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Unit cost</Table.Th>
                            <Table.Th>On hand</Table.Th>
                            <Table.Th>Reserved</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {items?.map((item) => (
                            <Table.Tr key={item.id}>
                                <Table.Td>{item.sku}</Table.Td>
                                <Table.Td>{item.name}</Table.Td>
                                <Table.Td>{item.unitCost}</Table.Td>
                                <Table.Td>{item.quantityOnHand}</Table.Td>
                                <Table.Td>{item.quantityReserved}</Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            )}

            <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add stock item">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack>
                        <TextInput label="SKU" error={errors.sku?.message} {...register('sku')} />
                        <TextInput label="Name" error={errors.name?.message} {...register('name')} />
                        <TextInput label="Unit" placeholder="pcs, kg, m, ..." error={errors.unit?.message} />
                        <Controller
                            name="unitCost"
                            control={control}
                            render={({ field, fieldState}) => (
                                <NumberInput label="Unit cost" min={0} decimalScale={2} value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
                            )}
                        />
                        <Button type="submit" loading={createItem.isPending} fullWidth>Create</Button>
                    </Stack>
                </form>
            </Modal>
        </Container>
    )
}