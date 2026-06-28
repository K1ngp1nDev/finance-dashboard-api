import { IsString, IsNumber, IsDateString, IsOptional, IsIn } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export const CATEGORIES = [
  'Food',
  'Rent',
  'Utilities',
  'Transport',
  'Subscriptions',
  'Shopping',
  'Health',
  'Travel',
  'Income',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

export class CreateTransactionDto {
  @ApiProperty({ example: 'Pizza Hut dinner' })
  @IsString()
  description: string

  @ApiProperty({ example: 24.99 })
  @IsNumber()
  @Type(() => Number)
  amount: number

  @ApiProperty({ example: '2026-04-11' })
  @IsDateString()
  date: string

  @ApiPropertyOptional({ enum: CATEGORIES })
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: Category

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string
}

export class UpdateTransactionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string

  @ApiPropertyOptional({ enum: CATEGORIES })
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: Category

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string
}

export class TransactionFiltersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string

  @ApiPropertyOptional({ enum: CATEGORIES })
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: Category
}
