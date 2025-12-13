const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const result = await prisma.user.update({
        where: {
            email: 'serkanxx@gmail.com'
        },
        data: {
            emailVerified: new Date()
        }
    });

    console.log('Email verified for:', result.email);
    console.log('emailVerified:', result.emailVerified);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
