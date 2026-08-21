// lib/prisma.js
const { PrismaClient } = require('@prisma/client');

// Create a single PrismaClient instance
const prisma = new PrismaClient();

module.exports = prisma;