import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { StockItemsModule } from './stock-items/stock-items.module';
import { DealsModule } from './deals/deals.module';
import { ContactsModdule } from './contacts/contacts.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    StockItemsModule,
    DealsModule,
    ContactsModdule,
  ],
})
export class AppModule {}


