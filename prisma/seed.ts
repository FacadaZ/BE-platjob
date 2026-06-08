import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // Clean the database
  console.log('Cleaning existing data...');
  await prisma.review.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.technicianProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  console.log('Creating Admin...');
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@platjob.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('Creating Clients...');
  const client1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash,
      role: 'CLIENT',
      location: 'New York, NY',
    },
  });

  const client2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      passwordHash,
      role: 'CLIENT',
      location: 'Los Angeles, CA',
    },
  });

  console.log('Creating Categories...');
  await prisma.category.createMany({
    data: [
      { key: 'electricista', label: 'Electricista' },
      { key: 'plomero', label: 'Plomero' },
      { key: 'carpintero', label: 'Carpintero' },
      { key: 'albanil', label: 'Albañil' },
      { key: 'pintor', label: 'Pintor' },
      { key: 'cerrajero', label: 'Cerrajero' },
      { key: 'climatizacion', label: 'Climatización' },
      { key: 'limpieza', label: 'Limpieza' },
      { key: 'jardinero', label: 'Jardinero' },
      { key: 'soldador', label: 'Soldador' },
    ],
  });

  console.log('Creating Technicians...');
  const tech1User = await prisma.user.create({
    data: {
      name: 'Bob Builder',
      email: 'bob@example.com',
      passwordHash,
      role: 'TECHNICIAN',
      location: 'New York, NY',
      phone: '123-456-7890',
    },
  });

  const tech1Profile = await prisma.technicianProfile.create({
    data: {
      userId: tech1User.id,
      categoryKey: 'plomero',
      specialties: JSON.stringify(['Pipes', 'Heaters', 'Leaks']),
      bio: 'Expert plumber with 10 years of experience.',
      hourlyRate: 50.0,
      isVerified: true,
      rating: 4.8,
      reviewCount: 15,
      jobsCompleted: 42,
    },
  });

  const tech2User = await prisma.user.create({
    data: {
      name: 'Alice Electric',
      email: 'alice@example.com',
      passwordHash,
      role: 'TECHNICIAN',
      location: 'Los Angeles, CA',
      phone: '987-654-3210',
    },
  });

  const tech2Profile = await prisma.technicianProfile.create({
    data: {
      userId: tech2User.id,
      categoryKey: 'electricista',
      specialties: JSON.stringify(['Wiring', 'Panels', 'Lighting']),
      bio: 'Certified electrician. Safety first.',
      hourlyRate: 65.0,
      isVerified: true,
      rating: 5.0,
      reviewCount: 8,
      jobsCompleted: 20,
    },
  });

  console.log('Creating Portfolio Items...');
  await prisma.portfolioItem.create({
    data: {
      technicianId: tech1Profile.id,
      title: 'Fixed burst pipe',
      description: 'Emergency repair of a burst water pipe in a residential home.',
      imageUrl: 'https://via.placeholder.com/300?text=Pipe+Repair',
    },
  });

  console.log('Creating Service Requests...');
  const request1 = await prisma.serviceRequest.create({
    data: {
      clientId: client1.id,
      technicianId: tech1Profile.id,
      category: 'plomero',
      title: 'Leaking Sink',
      description: 'The kitchen sink is leaking continuously from the bottom pipe.',
      status: 'COMPLETED',
      address: '123 Main St, New York, NY',
      budget: 100.0,
      agreedRate: 80.0,
      completedDate: new Date(),
    },
  });

  const request2 = await prisma.serviceRequest.create({
    data: {
      clientId: client2.id,
      technicianId: tech2Profile.id,
      category: 'electricista',
      title: 'Flickering Lights',
      description: 'Lights in the living room are flickering randomly.',
      status: 'PENDING',
      address: '456 Oak Ave, Los Angeles, CA',
      scheduledDate: new Date(Date.now() + 86400000), // Tomorrow
    },
  });

  console.log('Creating Reviews...');
  await prisma.review.create({
    data: {
      requestId: request1.id,
      clientId: client1.id,
      technicianId: tech1Profile.id,
      rating: 5,
      comment: 'Bob was fantastic! Quick and professional.',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
