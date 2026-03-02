require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fixSeed() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/homex');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // ── Drop and recreate users collection ──────────────────────────────────
    const collections = await db.listCollections().toArray();
    const colNames = collections.map(c => c.name);

    if (colNames.includes('users')) {
        await db.collection('users').drop();
        console.log('🗑  Dropped users collection');
    }
    if (colNames.includes('riders')) {
        await db.collection('riders').drop();
        console.log('🗑  Dropped riders collection');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedAdmin = await bcrypt.hash('admin123', salt);
    const hashedRider = await bcrypt.hash('rider123', salt);
    const hashedCustomer = await bcrypt.hash('customer123', salt);

    const now = new Date();

    // ── Insert rider document first so we can link it ───────────────────────
    const riderInsert = await db.collection('riders').insertOne({
        name: 'Ravi Kumar',
        phone: '9876543210',
        vehicleNo: 'DL 5S AB 1234',
        status: 'Available',
        isOnline: true,
        rating: 4.8,
        totalDeliveries: 42,
        earnings: 5040,
        todayEarnings: 360,
        location: { lat: 28.6139, lng: 77.2090, updatedAt: now },
        createdAt: now,
        updatedAt: now,
    });

    const riderId = riderInsert.insertedId;
    console.log(`✅ Created rider doc: ${riderId}`);

    // ── Insert users ─────────────────────────────────────────────────────────
    await db.collection('users').insertMany([
        {
            name: 'HomeX Admin',
            email: 'admin@homex.in',
            phone: null,
            password: hashedAdmin,
            role: 'admin',
            riderId: null,
            isActive: true,
            gstNumber: '',
            addresses: [],
            siteNames: [],
            wallet: 0,
            createdAt: now,
            updatedAt: now,
        },
        {
            name: 'Ravi Kumar',
            email: 'rider@homex.in',
            phone: null,
            password: hashedRider,
            role: 'rider',
            riderId: riderId,          // ← linked to Rider document
            isActive: true,
            gstNumber: '',
            addresses: [],
            siteNames: [],
            wallet: 0,
            createdAt: now,
            updatedAt: now,
        },
        {
            name: 'Test Customer',
            email: null,
            phone: '9999999999',
            password: null,
            role: 'customer',
            riderId: null,
            isActive: true,
            gstNumber: '',
            addresses: [],
            siteNames: [],
            wallet: 0,
            createdAt: now,
            updatedAt: now,
        }
    ]);

    // ── Create indexes ───────────────────────────────────────────────────────
    await db.collection('users').createIndex(
        { email: 1 },
        { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
    );
    await db.collection('users').createIndex(
        { phone: 1 },
        { unique: true, partialFilterExpression: { phone: { $type: 'string' } } }
    );
    await db.collection('users').createIndex({ role: 1 });

    console.log('✅ Users and indexes created');

    // ── Verify ───────────────────────────────────────────────────────────────
    const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
    console.log('\n📋 Users in DB:');
    users.forEach(u => console.log(`   [${u.role}] ${u.email || u.phone}  riderId=${u.riderId || 'null'}`));

    const riders = await db.collection('riders').find({}).toArray();
    console.log('\n🚚 Riders in DB:');
    riders.forEach(r => console.log(`   ${r.name} — ${r.vehicleNo}`));

    console.log('\n🎉 Login credentials:');
    console.log('   Admin    → admin@homex.in    / admin123');
    console.log('   Rider    → rider@homex.in    / rider123');
    console.log('   Customer → phone: 9999999999 / (OTP login)');

    await mongoose.disconnect();
    process.exit(0);
}

fixSeed().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
