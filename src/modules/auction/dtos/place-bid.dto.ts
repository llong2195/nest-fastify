import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PlaceBidDto {
  @IsString()
  @IsNotEmpty()
  auctionId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
