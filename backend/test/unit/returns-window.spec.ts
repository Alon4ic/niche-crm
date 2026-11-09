/**
 * Срок возврата. Проверяется через публичный метод list(), который сообщает eligible и blockedReason.
 * ВАЖНО: строки кодов ниже должны совпадать с кодами в вашем returns.service.ts (evaluateWindow).
 * Если какой-то тест упадёт на коде, сверьте строку, а не логику.
 */
import { DealStage } from '@prisma/client';
import { ReturnsService } from '../../src/deals/returns.service';

const CODE = {
  notWon: 'RETURN_NOT_WON',
  disabled: 'RETURNS_DISABLED', // в e2e-тесте пришёл RETURN_DISABLED: оставьте тот, что в вашем файле
  expired: 'RETURN_WINDOW_EXPIRED',
  nothingToReturn: 'NOTHING_TO_RETURN',
};

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

function make(deal: { stage: DealStage; closedAt: Date | null } | null, returnWindowDays: number) {
  const prisma = {
    deal: { findFirst: jest.fn().mockResolvedValue(deal && { id: 'd1', ...deal }) },
    tenant: { findUniqueOrThrow: jest.fn().mockResolvedValue({ returnWindowDays }) },
    // нет отгруженных строк: нас интересует только решение по сроку
    stockReservation: { groupBy: jest.fn().mockResolvedValue([]) },
    dealReturnItem: { groupBy: jest.fn().mockResolvedValue([]) },
    stockItem: { findMany: jest.fn().mockResolvedValue([]) },
    dealReturn: { findMany: jest.fn().mockResolvedValue([]) },
  };
  return new ReturnsService(prisma as any);
}

describe('ReturnsService: срок возврата', () => {
  it('сделка не выиграна: возврат невозможен', async () => {
    const res = await make({ stage: DealStage.NEGOTIATION, closedAt: null }, 14).list('t1', 'd1');
    expect(res.eligible).toBe(false);
    expect(res.blockedReason).toBe(CODE.notWon);
  });

  it('срок 0 дней: возвраты отключены', async () => {
    const res = await make({ stage: DealStage.WON, closedAt: daysAgo(1) }, 0).list('t1', 'd1');
    expect(res.eligible).toBe(false);
    expect(res.blockedReason).toBe(CODE.disabled);
  });

  it('внутри срока: окно открыто (причина блокировки не про срок)', async () => {
    const res = await make({ stage: DealStage.WON, closedAt: daysAgo(13) }, 14).list('t1', 'd1');
    expect(res.blockedReason).toBe(CODE.nothingToReturn); // окно не блокирует, нечего возвращать
    expect(res.blockedReason).not.toBe(CODE.expired);
  });

  it('срок истёк: возврат невозможен, дедлайн известен', async () => {
    const res = await make({ stage: DealStage.WON, closedAt: daysAgo(15) }, 14).list('t1', 'd1');
    expect(res.eligible).toBe(false);
    expect(res.blockedReason).toBe(CODE.expired);
    expect(res.deadline).toBeInstanceOf(Date);
  });

  it('срок считается от даты закрытия: дедлайн = закрытие + срок', async () => {
    const closedAt = daysAgo(3);
    const res = await make({ stage: DealStage.WON, closedAt }, 14).list('t1', 'd1');
    expect(res.deadline!.getTime()).toBe(closedAt.getTime() + 14 * DAY);
  });

  it('сделка другой компании: 404', async () => {
    await expect(make(null, 14).list('t1', 'd1')).rejects.toThrow('Deal not found');
  });
});
