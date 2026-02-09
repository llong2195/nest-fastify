import { Inject, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PlaceBidDto } from '../dtos/place-bid.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'auction',
})
export class AuctionGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AuctionGateway');

  constructor(
    @Inject('AUCTION_SERVICE') private readonly auctionClient: ClientKafka,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Auction Gateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() auctionId: string,
  ) {
    client.join(auctionId);
    this.logger.log(`Client ${client.id} joined auction ${auctionId}`);
    return { event: 'joined', data: auctionId };
  }

  @SubscribeMessage('placeBid')
  handlePlaceBid(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: PlaceBidDto,
  ) {
    this.logger.log(
      `Received bid for auction ${data.auctionId}: ${data.amount}`,
    );

    // Emit to Kafka
    this.auctionClient.emit('auction.bid.place', {
      ...data,
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });

    return { status: 'processing' };
  }
}
