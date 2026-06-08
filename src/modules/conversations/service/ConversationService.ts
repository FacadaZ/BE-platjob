import { conversationRepository } from '../repository/ConversationRepository.js';
import { userRepository } from '@modules/users/repository/UserRepository.js';
import { AppError } from '@shared/errors/AppError.js';
import { prisma } from '@shared/database/prisma.js';

export class ConversationService {
  async findOrCreate(user1Id: string | number, user2Id: string | number, serviceRequestId?: string | number): Promise<any> {
    if (user1Id === user2Id) {
      throw AppError.badRequest('No puedes iniciar una conversación contigo mismo');
    }

    const recipient = await userRepository.findById(user2Id);
    if (!recipient) {
      throw AppError.notFound('El usuario destinatario no existe');
    }

    return conversationRepository.findOrCreate(user1Id, user2Id, serviceRequestId);
  }

  async getById(conversationId: string | number, userId: string | number): Promise<any> {
    const conversation = await conversationRepository.findById(conversationId);

    if (!conversation) {
      throw AppError.notFound('Conversación no encontrada');
    }

    // Verificar que el usuario participa en la conversación
    const isParticipant = conversation.participants.some((p: any) => p.userId === Number(userId));
    if (!isParticipant) {
      throw AppError.forbidden('No tienes permiso para ver esta conversación');
    }

    return conversation;
  }

  async list(userId: string | number): Promise<any[]> {
    return conversationRepository.listUserConversations(userId);
  }

  async sendMessage(conversationId: string | number, senderId: string | number, content: string): Promise<any> {
    const conversation = await conversationRepository.findById(conversationId);

    if (!conversation) {
      throw AppError.notFound('Conversación no encontrada');
    }

    const isParticipant = conversation.participants.some((p: any) => p.userId === Number(senderId));
    if (!isParticipant) {
      throw AppError.forbidden('No eres participante de esta conversación');
    }

    return conversationRepository.saveMessage(conversationId, senderId, content);
  }

  async markAsRead(conversationId: string | number, userId: string | number): Promise<void> {
    const conversation = await conversationRepository.findById(conversationId);

    if (!conversation) {
      throw AppError.notFound('Conversación no encontrada');
    }

    const isParticipant = conversation.participants.some((p: any) => p.userId === Number(userId));
    if (!isParticipant) {
      throw AppError.forbidden('No eres participante de esta conversación');
    }

    await conversationRepository.markAsRead(conversationId, userId);
  }

  async proposeNegotiation(conversationId: string | number, senderId: string | number, data: { newPrice?: number, newDate?: string }): Promise<any> {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw AppError.notFound('Conversación no encontrada');
    if (!conversation.serviceRequestId) throw AppError.badRequest('Esta conversación no está asociada a una solicitud de servicio');

    const content = 'He propuesto una nueva negociación';
    const metadata = JSON.stringify(data);
    const message = await conversationRepository.saveMessage(conversationId, senderId, content, 'NEGOTIATION_PROPOSAL', metadata);
    return message;
  }

  async acceptNegotiation(conversationId: string | number, messageId: string | number, userId: string | number): Promise<any> {
    const numericMessageId = Number(messageId);
    const message = await prisma.chatMessage.findUnique({ where: { id: numericMessageId } });
    if (!message || message.type !== 'NEGOTIATION_PROPOSAL') {
      throw AppError.notFound('Propuesta de negociación no encontrada');
    }
    
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw AppError.notFound('Conversación no encontrada');
    if (!conversation.serviceRequestId) throw AppError.badRequest('No hay solicitud asociada');
    
    // Check if the user trying to accept is the one who sent it (they can't accept their own)
    if (message.senderId === Number(userId)) {
      throw AppError.badRequest('No puedes aceptar tu propia propuesta');
    }

    // Parse metadata
    const metadata = JSON.parse(message.metadata || '{}');
    const updateData: any = {};
    if (metadata.newPrice) updateData.agreedRate = Number(metadata.newPrice);
    if (metadata.newDate) updateData.scheduledDate = new Date(metadata.newDate);

    // Update ServiceRequest
    await prisma.serviceRequest.update({
      where: { id: conversation.serviceRequestId },
      data: updateData
    });

    // Mark original message as accepted
    await prisma.chatMessage.update({
      where: { id: numericMessageId },
      data: { type: 'NEGOTIATION_ACCEPTED' }
    });

    // Send a system message confirming the acceptance
    const confirmMessage = await conversationRepository.saveMessage(
      conversationId,
      userId,
      '¡Propuesta aceptada! Los detalles del servicio han sido actualizados.',
      'SYSTEM',
      null
    );

    return confirmMessage;
  }

  async delete(conversationId: string | number, userId: string | number): Promise<void> {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw AppError.notFound('Conversación no encontrada');
    }

    const isParticipant = conversation.participants.some((p: any) => p.userId === Number(userId));
    if (!isParticipant) {
      throw AppError.forbidden('No eres participante de esta conversación');
    }

    await conversationRepository.delete(conversationId);
  }
}
export const conversationService = new ConversationService();
