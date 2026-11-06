import  { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateContactDto } from './create-contact.dto';

export class UpdateContactDto extends PartialType(
    OmitType(CreateContactDto, ['clientId'] as const),
 ) {}