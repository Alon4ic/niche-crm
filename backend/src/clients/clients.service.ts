import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";

@Injectable()
export class ClientsService {
    constructor(private readonly prisma: PrismaService) {}

    create(tenantId: string, dto: CreateClientDto) {
        return this.prisma.client.create({
            data: { ...dto, tenantId },
        });
    }

    findAll(tenantId: string){
        return this.prisma.client.findMany({ where: { tenantId } })
    }

    async findOne(tenantId: string, id: string) {
        const client = await this.prisma.client.findFirst({ where: { id, tenantId } });
        if (!client) {
            throw new NotFoundException('Client not found');
        }
        return client;
    }

    async update(tenantId: string, id: string, dto: UpdateClientDto) {
        await this.findOne(tenantId, id);
        return this.prisma.client.update({ where: {id}, data: dto });
    }

    async remove(tenantId: string, id: string) {
        await this.findOne(tenantId, id);
        await this.prisma.client.delete({ where: { id } })
    }
}