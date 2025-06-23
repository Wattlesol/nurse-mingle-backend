require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create default admin user
    const adminPassword = await bcrypt.hash(
      process.env.ADMIN_DEFAULT_PASSWORD || 'admin123',
      parseInt(process.env.BCRYPT_ROUNDS) || 12
    );

    const admin = await prisma.adminUser.upsert({
      where: { username: process.env.ADMIN_DEFAULT_USERNAME || 'admin' },
      update: {},
      create: {
        username: process.env.ADMIN_DEFAULT_USERNAME || 'admin',
        password: adminPassword,
        userType: 'admin'
      }
    });

    console.log('✅ Admin user created:', admin.username);

    // Create default app data
    const appData = await prisma.appData.upsert({
      where: { id: 1 },
      update: {},
      create: {
        appName: process.env.APP_NAME || 'Orange',
        appVersion: process.env.APP_VERSION || '1.0.0',
        privacyPolicy: 'Default privacy policy content...',
        termsOfUse: 'Default terms of use content...',
        supportEmail: 'support@orange.com'
      }
    });

    console.log('✅ App data created:', appData.appName);

    // Create default interests
    const interests = [
      { name: 'Music', image: null },
      { name: 'Sports', image: null },
      { name: 'Gaming', image: null },
      { name: 'Travel', image: null },
      { name: 'Food', image: null },
      { name: 'Fashion', image: null },
      { name: 'Technology', image: null },
      { name: 'Art', image: null },
      { name: 'Photography', image: null },
      { name: 'Fitness', image: null },
      { name: 'Movies', image: null },
      { name: 'Books', image: null },
      { name: 'Dance', image: null },
      { name: 'Comedy', image: null },
      { name: 'Education', image: null }
    ];

    for (const interest of interests) {
      await prisma.interest.upsert({
        where: { name: interest.name },
        update: {},
        create: interest
      });
    }

    console.log('✅ Interests created:', interests.length);

    // Create default diamond packs
    const diamondPacks = [
      { name: '100 Diamonds', diamonds: 100, price: 0.99, currency: 'USD' },
      { name: '500 Diamonds', diamonds: 500, price: 4.99, currency: 'USD' },
      { name: '1000 Diamonds', diamonds: 1000, price: 9.99, currency: 'USD' },
      { name: '2500 Diamonds', diamonds: 2500, price: 19.99, currency: 'USD' },
      { name: '5000 Diamonds', diamonds: 5000, price: 39.99, currency: 'USD' },
      { name: '10000 Diamonds', diamonds: 10000, price: 79.99, currency: 'USD' }
    ];

    for (const pack of diamondPacks) {
      await prisma.diamondPack.upsert({
        where: { name: pack.name },
        update: {},
        create: pack
      });
    }

    console.log('✅ Diamond packs created:', diamondPacks.length);

    // Create default gift types
    const giftTypes = [
      { name: 'Rose', image: null, price: 1 },
      { name: 'Heart', image: null, price: 5 },
      { name: 'Kiss', image: null, price: 10 },
      { name: 'Diamond Ring', image: null, price: 50 },
      { name: 'Sports Car', image: null, price: 100 },
      { name: 'Yacht', image: null, price: 500 },
      { name: 'Private Jet', image: null, price: 1000 },
      { name: 'Castle', image: null, price: 5000 }
    ];

    for (const gift of giftTypes) {
      await prisma.giftType.upsert({
        where: { name: gift.name },
        update: {},
        create: gift
      });
    }

    console.log('✅ Gift types created:', giftTypes.length);

    // Create default app settings
    const appSettings = [
      { key: 'maintenance_mode', value: 'false', type: 'boolean' },
      { key: 'registration_enabled', value: 'true', type: 'boolean' },
      { key: 'guest_login_enabled', value: 'true', type: 'boolean' },
      { key: 'live_streaming_enabled', value: 'true', type: 'boolean' },
      { key: 'max_post_length', value: '2000', type: 'number' },
      { key: 'max_comment_length', value: '500', type: 'number' },
      { key: 'story_duration_hours', value: '24', type: 'number' },
      { key: 'min_diamonds_for_redeem', value: '1000', type: 'number' },
      { key: 'diamond_to_coin_ratio', value: '1', type: 'number' },
      { key: 'featured_users_limit', value: '10', type: 'number' }
    ];

    for (const setting of appSettings) {
      await prisma.appSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting
      });
    }

    console.log('✅ App settings created:', appSettings.length);

    // Create sample users for testing (optional)
    if (process.env.NODE_ENV === 'development') {
      const sampleUsers = [
        {
          username: 'john_doe',
          email: 'john@example.com',
          fullName: 'John Doe',
          bio: 'Love music and travel!',
          age: 25,
          gender: 'male',
          loginType: 'email',
          diamonds: 1000,
          coins: 500
        },
        {
          username: 'jane_smith',
          email: 'jane@example.com',
          fullName: 'Jane Smith',
          bio: 'Photographer and artist',
          age: 28,
          gender: 'female',
          loginType: 'email',
          diamonds: 2000,
          coins: 1000,
          isVerified: true
        },
        {
          username: 'mike_wilson',
          email: 'mike@example.com',
          fullName: 'Mike Wilson',
          bio: 'Fitness enthusiast',
          age: 30,
          gender: 'male',
          loginType: 'email',
          diamonds: 500,
          coins: 250,
          canGoLive: true
        }
      ];

      for (const userData of sampleUsers) {
        const hashedPassword = await bcrypt.hash('password123', 12);
        
        await prisma.user.upsert({
          where: { email: userData.email },
          update: {},
          create: {
            ...userData,
            password: hashedPassword
          }
        });
      }

      console.log('✅ Sample users created:', sampleUsers.length);
    }

    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;
