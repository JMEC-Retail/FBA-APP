import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const SALT_ROUNDS = 12

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

// Create libsql adapter for local SQLite development
const adapter = new PrismaLibSql({
  url: 'file:./dev.db'
})

const prisma = new PrismaClient({
  adapter,
})

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create default PACKER user (station-based)
  const defaultPackerEmail = 'packer@station.com'
  const defaultPackerPassword = 'packer123'
  
  const existingPacker = await prisma.user.findUnique({
    where: { email: defaultPackerEmail }
  })

  if (!existingPacker) {
    const hashedPackerPassword = await hashPassword(defaultPackerPassword)
    
    await prisma.user.create({
      data: {
        email: defaultPackerEmail,
        name: 'Default Packer Station',
        password: hashedPackerPassword,
        role: 'PACKER'
      }
    })
    console.log('✅ Created default PACKER user:', defaultPackerEmail)
  } else {
    console.log('ℹ️ Default PACKER user already exists:', defaultPackerEmail)
  }

  // Create Picker users with 128-bit UUIDs and nicknames
  const pickerUsers = [
    { uuid: uuidv4(), nickname: 'Alpha', email: 'picker-alpha@system.local' },
    { uuid: uuidv4(), nickname: 'Beta', email: 'picker-beta@system.local' },
    { uuid: uuidv4(), nickname: 'Gamma', email: 'picker-gamma@system.local' },
    { uuid: uuidv4(), nickname: 'Delta', email: 'picker-delta@system.local' },
    { uuid: uuidv4(), nickname: 'Epsilon', email: 'picker-epsilon@system.local' },
    { uuid: uuidv4(), nickname: 'Zeta', email: 'picker-zeta@system.local' },
    { uuid: uuidv4(), nickname: 'Eta', email: 'picker-eta@system.local' },
    { uuid: uuidv4(), nickname: 'Theta', email: 'picker-theta@system.local' },
    { uuid: uuidv4(), nickname: 'Iota', email: 'picker-iota@system.local' },
    { uuid: uuidv4(), nickname: 'Kappa', email: 'picker-kappa@system.local' },
  ]

  const pickerPassword = 'picker123'
  const hashedPickerPassword = await hashPassword(pickerPassword)

  for (const picker of pickerUsers) {
    const existingPicker = await prisma.user.findUnique({
      where: { email: picker.email }
    })

    if (!existingPicker) {
      await prisma.user.create({
        data: {
          email: picker.email,
          name: `Picker ${picker.nickname}`,
          password: hashedPickerPassword,
          role: 'PACKER'
        }
      })
      console.log(`✅ Created picker user: ${picker.nickname} (${picker.email})`)
      console.log(`   UUID: ${picker.uuid}`)
    } else {
      console.log(`ℹ️ Picker user already exists: ${picker.nickname} (${picker.email})`)
    }
  }

  // Create default ADMIN user if no admin exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!existingAdmin) {
    const adminEmail = 'admin@system.local'
    const adminPassword = 'admin123'
    
    const hashedAdminPassword = await hashPassword(adminPassword)
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'System Administrator',
        password: hashedAdminPassword,
        role: 'ADMIN'
      }
    })
    console.log('✅ Created default ADMIN user:', adminEmail)
  } else {
    console.log('ℹ️ ADMIN user already exists:', existingAdmin.email)
  }

  // Create default SHIPPER user for testing
  const existingShipper = await prisma.user.findFirst({
    where: { role: 'SHIPPER' }
  })

  if (!existingShipper) {
    const shipperEmail = 'shipper@system.local'
    const shipperPassword = 'shipper123'
    
    const hashedShipperPassword = await hashPassword(shipperPassword)
    
    await prisma.user.create({
      data: {
        email: shipperEmail,
        name: 'Default Shipper',
        password: hashedShipperPassword,
        role: 'SHIPPER'
      }
    })
    console.log('✅ Created default SHIPPER user:', shipperEmail)
  } else {
    console.log('ℹ️ SHIPPER user already exists:', existingShipper.email)
  }

  console.log('\n🎉 Database seeding completed!')
  console.log('\n📋 Default Credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🏢 ADMIN: admin@system.local / admin123')
  console.log('🚚 SHIPPER: shipper@system.local / shipper123')
  console.log('📦 PACKER: packer@station.com / packer123')
  console.log('🔍 PICKER: picker-alpha@system.local / picker123 (and 9 more picker accounts)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })