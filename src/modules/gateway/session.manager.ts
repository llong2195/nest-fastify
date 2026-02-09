import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

/**
 * SessionManager: Handles user session tracking for Socket.io connections.
 * Essential for high-load scenarios to track online users, map user IDs to socket IDs,
 * and enable targeted messaging.
 *
 * Design for ~10,000 req/s:
 * - In-memory Map for O(1) lookups
 * - For multi-server: Use Redis for session storage (see Redis patterns below)
 */
@Injectable()
export class SessionManager {
  private readonly logger = new Logger(SessionManager.name);

  // userId -> Set of socketIds (one user can have multiple connections)
  private readonly userSockets = new Map<string, Set<string>>();

  // socketId -> userId (reverse lookup)
  private readonly socketUsers = new Map<string, string>();

  // socketId -> Socket instance (for direct access)
  private readonly sockets = new Map<string, Socket>();

  // Room membership tracking: roomName -> Set of userIds
  private readonly roomMembers = new Map<string, Set<string>>();

  /**
   * Register a user's socket connection
   */
  registerUser(userId: string, socket: Socket): void {
    // Store socket instance
    this.sockets.set(socket.id, socket);

    // Map socket to user
    this.socketUsers.set(socket.id, userId);

    // Add socket to user's socket set
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);

    this.logger.debug(
      `User ${userId} registered with socket ${socket.id}. Total connections: ${this.userSockets.get(userId)!.size}`,
    );
  }

  /**
   * Unregister a socket connection
   */
  unregisterSocket(socketId: string): string | undefined {
    const userId = this.socketUsers.get(socketId);

    if (userId) {
      // Remove from user's socket set
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socketId);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
          this.logger.debug(
            `User ${userId} has no more connections, removing from session`,
          );
        }
      }
      this.socketUsers.delete(socketId);
    }

    this.sockets.delete(socketId);
    return userId;
  }

  /**
   * Get all socket IDs for a user (for multi-device support)
   */
  getUserSockets(userId: string): string[] {
    const socketSet = this.userSockets.get(userId);
    return socketSet ? Array.from(socketSet) : [];
  }

  /**
   * Get user ID by socket ID
   */
  getUserBySocket(socketId: string): string | undefined {
    return this.socketUsers.get(socketId);
  }

  /**
   * Get socket instance by ID
   */
  getSocket(socketId: string): Socket | undefined {
    return this.sockets.get(socketId);
  }

  /**
   * Check if user is online (has at least one connection)
   */
  isUserOnline(userId: string): boolean {
    const socketSet = this.userSockets.get(userId);
    return socketSet !== undefined && socketSet.size > 0;
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Get total connection count
   */
  getConnectionCount(): number {
    return this.sockets.size;
  }

  /**
   * Add user to a room (for room membership tracking)
   */
  addUserToRoom(userId: string, roomName: string): void {
    if (!this.roomMembers.has(roomName)) {
      this.roomMembers.set(roomName, new Set());
    }
    this.roomMembers.get(roomName)!.add(userId);
  }

  /**
   * Remove user from a room
   */
  removeUserFromRoom(userId: string, roomName: string): void {
    const members = this.roomMembers.get(roomName);
    if (members) {
      members.delete(userId);
      if (members.size === 0) {
        this.roomMembers.delete(roomName);
      }
    }
  }

  /**
   * Get all members in a room
   */
  getRoomMembers(roomName: string): string[] {
    const members = this.roomMembers.get(roomName);
    return members ? Array.from(members) : [];
  }

  /**
   * Get all rooms a user is in
   */
  getUserRooms(userId: string): string[] {
    const rooms: string[] = [];
    for (const [roomName, members] of this.roomMembers.entries()) {
      if (members.has(userId)) {
        rooms.push(roomName);
      }
    }
    return rooms;
  }
}
