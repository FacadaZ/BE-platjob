import { prisma } from '@shared/database/prisma.js';
import { ChatMessage } from '@prisma/client';

export class ConversationRepository {
  async findOrCreate(user1Id: string | number, user2Id: string | number, serviceRequestId?: string | number): Promise<any> {
    const u1 = Number(user1Id);
    const u2 = Number(user2Id);
    const srId = serviceRequestId ? Number(serviceRequestId) : undefined;
    // 1. Buscar si existe una conversación entre ambos participantes
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: u1 } } },
          { participants: { some: { userId: u2 } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (existing) {
      if (srId && existing.serviceRequestId !== srId) {
        // Update to the new service request if it changed
        const updated = await prisma.conversation.update({
          where: { id: existing.id },
          data: { serviceRequestId: srId },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    role: true,
                  },
                },
              },
            },
          },
        });
        return updated;
      }
      return existing;
    }

    // 2. Si no existe, crear una nueva conversación relacional
    return prisma.conversation.create({
      data: {
        serviceRequestId: srId,
        participants: {
          create: [{ userId: u1 }, { userId: u2 }],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async findById(id: string | number): Promise<any | null> {
    const numericId = Number(id);
    return prisma.conversation.findUnique({
      where: { id: numericId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });
  }

  async listUserConversations(userId: string | number): Promise<any[]> {
    const uId = Number(userId);
    return prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: uId },
        },
      },
      include: {
        participants: {
          where: {
            userId: { not: uId },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1,
        },
        serviceRequest: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async saveMessage(conversationId: string | number, senderId: string | number, content: string, type: string = 'TEXT', metadata: string | null = null): Promise<ChatMessage> {
    const cId = Number(conversationId);
    const sId = Number(senderId);
    return prisma.$transaction(async (tx) => {
      // 1. Guardar mensaje
      const message = await tx.chatMessage.create({
        data: {
          conversation: { connect: { id: cId } },
          sender: { connect: { id: sId } },
          content,
          type,
          metadata,
        },
      });

      // 2. Actualizar timestamp de la conversación para ordenarla
      await tx.conversation.update({
        where: { id: cId },
        data: { updatedAt: new Date() },
      });

      return message;
    });
  }

  async markAsRead(conversationId: string | number, userId: string | number): Promise<void> {
    const cId = Number(conversationId);
    const uId = Number(userId);
    await prisma.chatMessage.updateMany({
      where: {
        conversationId: cId,
        senderId: { not: uId },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async delete(conversationId: string | number): Promise<void> {
    const cId = Number(conversationId);
    await prisma.conversation.delete({
      where: { id: cId }
    });
  }
}
export const conversationRepository = new ConversationRepository();
