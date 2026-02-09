import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateAuctionDto {
  @ApiProperty({ example: 'Vintage Watch Collection' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'A rare vintage watch from 1960s' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 100 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  startingPrice: number;

  @ApiPropertyOptional({ example: 5, default: 1 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  minBidIncrement?: number;

  @ApiProperty({ example: '2026-03-01T10:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-03-01T22:00:00Z' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ example: 'watches' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class UpdateAuctionDto extends PartialType(CreateAuctionDto) {}

export class AuctionResponseDto {
  id: number;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  minBidIncrement: number;
  startTime: Date;
  endTime: Date;
  status: string;
  sellerId: number;
  winnerId: number | null;
  totalBids: number;
  imageUrl: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CancelAuctionDto {
  @ApiProperty({ example: 'Item no longer available' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class PlaceBidDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @Type(() => Number)
  auctionId: number;

  @ApiProperty({ example: 150.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({
    example: 'bid-uuid-unique-key',
    description: 'Client-generated idempotency key to prevent duplicate bids',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  idempotencyKey?: string;
}

export class BidResponseDto {
  id: number;
  auctionId: number;
  bidderId: number;
  amount: number;
  status: string;
  createdAt: Date;
}

export class AuctionListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ example: 'active' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'watches' })
  @IsString()
  @IsOptional()
  category?: string;
}
