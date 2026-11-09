import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { StockItemsService } from '../../src/stock-items/stock-items.service';

const D = (n: number | string) => new Prisma.Decimal(n);
const item = (onHand: number | string, reserved: number | string) => ({
  id: 'i1',
  sku: 'S',
  name: 'N',
  unit: 'pcs',
  unitCost: D(1),
  quantityOnHand: D(onHand),
  quantityReserved: D(reserved),
});

function make(items: unknown[]) {
  const prisma = {
    stockItem: {
      findMany: jest.fn().mockResolvedValue(items),
      findFirst: jest.fn().mockResolvedValue(items[0] ?? null),
    },
  };
  return { service: new StockItemsService(prisma as any), prisma };
}

describe('StockItemsService: quantityAvailable', () => {
  it('доступно = на складе − зарезервировано', async () => {
    const { service } = make([item(100, 10)]);
    const [res] = await service.findAll('t1');
    expect(res.quantityAvailable.toString()).toBe('90');
    // исходные числа не изменены
    expect(res.quantityOnHand.toString()).toBe('100');
    expect(res.quantityReserved.toString()).toBe('10');
  });

  it('всё зарезервировано: доступно 0', async () => {
    const { service } = make([item(10, 10)]);
    expect((await service.findAll('t1'))[0].quantityAvailable.toString()).toBe('0');
  });

  it('дробные количества считаются точно (Decimal, а не float)', async () => {
    // в обычных числах 0.3 - 0.1 = 0.19999999999999998
    const { service } = make([item('0.3', '0.1')]);
    expect((await service.findAll('t1'))[0].quantityAvailable.toString()).toBe('0.2');
  });

  it('findOne тоже отдаёт доступный остаток', async () => {
    const { service } = make([item(50, 5)]);
    expect((await service.findOne('t1', 'i1')).quantityAvailable.toString()).toBe('45');
  });

  it('findAll выбирает только данные своей компании', async () => {
    const { service, prisma } = make([]);
    await service.findAll('tenant-42');
    expect(prisma.stockItem.findMany).toHaveBeenCalledWith({ where: { tenantId: 'tenant-42' } });
  });

  it('findOne: чужой или несуществующий id даёт 404', async () => {
    const { service, prisma } = make([]);
    await expect(service.findOne('t1', 'nope')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.stockItem.findFirst).toHaveBeenCalledWith({ where: { id: 'nope', tenantId: 't1' } });
  });
});
