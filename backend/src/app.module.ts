import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { StockItemsModule } from './stock-items/stock-items.module';
import { DealsModule } from './deals/deals.module';
import { ContactsModdule } from './contacts/contacts.module';
import { UsersModule } from './users/users.module';
import { ImportsModule } from './imports/imports.module';
import { SettingsModule } from './settings/settings.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { HealthController } from "./health/health.controller"


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 300 }],
      skipIf: () => process.env.NODE_ENV === "test",
    }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    StockItemsModule,
    DealsModule,
    ContactsModdule,
    UsersModule,
    ImportsModule,
    SettingsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}


// ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 300 }]),

