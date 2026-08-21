// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin@123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admingen@gmail.com' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
      name: 'Genesis Admin',
      phone: '+1 555 123 4567', // Added phone to update
    },
    create: {
      name: 'Genesis Admin',
      email: 'admingen@gmail.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+1 555 123 4567',
    },
  })
  console.log('✅ Admin created:', admin.email)
  console.log('   Password: admin@123')
  console.log('   Phone:', admin.phone)

  // Create Regular User (Customer)
  const userPassword = await bcrypt.hash('user@123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'user@genesissagri.com' },
    update: {
      password: userPassword,
      role: 'USER',
      name: 'Genesis Customer',
      phone: '+1 555 987 6543', // Added phone to update
    },
    create: {
      name: 'Genesis Customer',
      email: 'user@genesissagri.com',
      password: userPassword,
      role: 'USER',
      phone: '+1 555 987 6543',
    },
  })
  console.log('✅ Regular user created:', user.email)
  console.log('   Password: user@123')
  console.log('   Phone:', user.phone)

  // Verify passwords work
  const verifyAdmin = await bcrypt.compare('admin@123', admin.password)
  const verifyUser = await bcrypt.compare('user@123', user.password)
  console.log('🔐 Admin password valid:', verifyAdmin)
  console.log('🔐 User password valid:', verifyUser)

  // Create Agricultural Categories
  const categoryData = [
    { 
      name: 'Fresh Produce', 
      slug: 'fresh-produce', 
      description: 'Fresh fruits and vegetables from local farms',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&h=600&fit=crop',
      icon: '🌾',
      color: '#22c55e'
    },
    { 
      name: 'Farm Equipment', 
      slug: 'farm-equipment', 
      description: 'Quality tools and machinery for farming',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
      icon: '🚜',
      color: '#eab308'
    },
    { 
      name: 'Seeds & Fertilizers', 
      slug: 'seeds-fertilizers', 
      description: 'Premium seeds and organic fertilizers',
      image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&h=600&fit=crop',
      icon: '🌱',
      color: '#16a34a'
    },
    { 
      name: 'Livestock', 
      slug: 'livestock', 
      description: 'Healthy animals for sustainable farming',
      image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&h=600&fit=crop',
      icon: '🐄',
      color: '#8b5cf6'
    },
    { 
      name: 'Irrigation Systems', 
      slug: 'irrigation-systems', 
      description: 'Smart watering solutions for your farm',
      image: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&h=600&fit=crop',
      icon: '💧',
      color: '#3b82f6'
    },
    { 
      name: 'Organic Products', 
      slug: 'organic-products', 
      description: 'Certified organic agricultural products',
      image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=600&fit=crop',
      icon: '🌿',
      color: '#059669'
    },
    { 
      name: 'Poultry & Eggs', 
      slug: 'poultry-eggs', 
      description: 'Fresh poultry and eggs from free-range farms',
      image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&h=600&fit=crop',
      icon: '🐔',
      color: '#f97316'
    },
    { 
      name: 'Dairy Products', 
      slug: 'dairy-products', 
      description: 'Fresh milk, cheese, and dairy products',
      image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=600&fit=crop',
      icon: '🥛',
      color: '#6366f1'
    },
  ]

  for (const cat of categoryData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        image: cat.image,
        icon: cat.icon,
        color: cat.color,
        description: cat.description,
        status: 'APPROVED',
        approvedBy: admin.id,
        approvedAt: new Date(),
      },
      create: {
        ...cat,
        status: 'APPROVED',
        createdBy: admin.id,
        approvedBy: admin.id,
        approvedAt: new Date(),
      },
    })
  }
  console.log('✅ Agricultural categories created')

  console.log('\n🎉 Seed complete!')
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 Login Credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👑 Admin:')
  console.log('   Email: admingen@gmail.com')
  console.log('   Password: admin@123')
  console.log('   Phone: +1 555 123 4567')
  console.log('   Role: ADMIN')
  console.log('   URL: http://localhost:3000/admin')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👤 User:')
  console.log('   Email: user@genesissagri.com')
  console.log('   Password: user@123')
  console.log('   Phone: +1 555 987 6543')
  console.log('   Role: USER')
  console.log('   URL: http://localhost:3000')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })