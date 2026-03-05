require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Rider = require('./models/Rider');
const User = require('./models/User');

const riders = [
  { name: 'Ravi Kumar', phone: '+91 98200 11234', vehicleNo: 'MH-04-AB-1234', status: 'Available', totalDeliveries: 342, rating: 4.8, photo: 'https://i.pravatar.cc/150?img=3' },
  { name: 'Suresh Patel', phone: '+91 98765 55678', vehicleNo: 'MH-04-CD-5678', status: 'Available', totalDeliveries: 215, rating: 4.6, photo: 'https://i.pravatar.cc/150?img=12' },
  { name: 'Arjun Singh', phone: '+91 91234 99876', vehicleNo: 'MH-01-EF-9012', status: 'Available', totalDeliveries: 180, rating: 4.9, photo: 'https://i.pravatar.cc/150?img=7' },
];

const products = [
  // CEMENT
  { name: 'UltraTech OPC 53 Grade Cement', category: 'Cement', price: 380, stock: 500, unit: 'bag', weight: '50kg', brand: 'UltraTech', featured: true, description: 'Premium Ordinary Portland Cement for structural RCC construction. ISI certified, high early strength.', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
  { name: 'ACC PPC Blended Cement', category: 'Cement', price: 350, stock: 300, unit: 'bag', weight: '50kg', brand: 'ACC', featured: false, description: 'Portland Pozzolana Cement with fly ash blend. Ideal for plastering, masonry and brick work.', image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80' },
  { name: 'Ambuja Plus Cement', category: 'Cement', price: 360, stock: 250, unit: 'bag', weight: '50kg', brand: 'Ambuja', featured: false, description: 'High durability cement with superior water repelling properties. Best for coastal areas.', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
  { name: 'White Portland Cement', category: 'Cement', price: 850, stock: 80, unit: 'bag', weight: '25kg', brand: 'JK White', featured: false, description: 'Pure white cement for decorative plastering, tile fixing and artistic finishes.', image: 'https://images.unsplash.com/photo-1563461660947-507ef49e9c47?w=600&q=80' },

  // STEEL
  { name: 'TATA Tiscon TMT 8mm Bar', category: 'Steel', price: 650, stock: 800, unit: 'rod', weight: '12m', brand: 'TATA Tiscon', featured: true, description: 'High tensile TMT 500D reinforcement bars for RCC slabs and foundations. BIS certified.', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
  { name: 'TATA Tiscon TMT 12mm Bar', category: 'Steel', price: 980, stock: 600, unit: 'rod', weight: '12m', brand: 'TATA Tiscon', featured: true, description: 'Heavy duty TMT bar for columns, beams and load-bearing structures. Fe 500D grade.', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
  { name: 'SAIL TMT 16mm Bar', category: 'Steel', price: 1250, stock: 400, unit: 'rod', weight: '12m', brand: 'SAIL', featured: false, description: 'Extra heavy duty SAIL TMT bars for large span bridges and high-rise structures.', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },

  // BRICKS
  { name: 'Red Clay Bricks (Standard)', category: 'Bricks', price: 8, stock: 10000, unit: 'piece', weight: '3.5kg', brand: 'Local Kiln', featured: true, description: 'Standard modular red clay bricks, kiln fired at 900°C. IS:1077 certified.', image: 'https://images.unsplash.com/photo-1605152276897-4f618f831968?w=600&q=80' },
  { name: 'AAC Autoclaved Blocks', category: 'Bricks', price: 55, stock: 2000, unit: 'piece', weight: '4kg', brand: 'Siporex', featured: false, description: 'Lightweight autoclaved aerated concrete blocks. Excellent thermal insulation. 3x faster construction.', image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&q=80' },
  { name: 'Fly Ash Bricks', category: 'Bricks', price: 6, stock: 8000, unit: 'piece', weight: '3kg', brand: 'EcoBricks', featured: false, description: 'Eco-friendly fly ash bricks. High compressive strength, uniform size, less water absorption.', image: 'https://images.unsplash.com/photo-1605152276897-4f618f831968?w=600&q=80' },

  // SAND
  { name: 'River Sand (Fine Grade)', category: 'Sand', price: 2200, stock: 50, unit: 'tonne', weight: '1 Tonne', brand: 'Quarry Fresh', featured: false, description: 'Clean sieved river sand for plastering and fine concrete mix. Free from silt and clay.', image: 'https://images.unsplash.com/photo-1548407260-da850faa41e3?w=600&q=80' },
  { name: 'M-Sand (Manufactured Sand)', category: 'Sand', price: 1800, stock: 80, unit: 'tonne', weight: '1 Tonne', brand: 'Blue Metal', featured: false, description: 'Crushed granite manufactured sand. Eco-friendly river sand substitute with consistent gradation.', image: 'https://images.unsplash.com/photo-1548407260-da850faa41e3?w=600&q=80' },

  // PLUMBING
  { name: 'Astral CPVC Pipe 1 Inch', category: 'Plumbing', price: 320, stock: 200, unit: 'piece', weight: '3m', brand: 'Astral', featured: false, description: 'Chlorinated PVC pipe for hot & cold water. Pressure rated up to 10 bar. NSF certified.', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80' },
  { name: 'Supreme PVC Water Tank 500L', category: 'Plumbing', price: 3200, stock: 15, unit: 'piece', weight: '500L', brand: 'Supreme', featured: false, description: 'Food-grade PVC water storage tank. UV stabilized, triple layer insulation. 10-year warranty.', image: 'https://images.unsplash.com/photo-1602052793312-b99c2a9ee797?w=600&q=80' },
  { name: 'Finolex UPVC Pipe 4 Inch', category: 'Plumbing', price: 680, stock: 120, unit: 'piece', weight: '6m', brand: 'Finolex', featured: false, description: 'Heavy duty UPVC drainage pipe for sewage and rainwater. IS:4985 certified. Ring seal joints.', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80' },

  // ELECTRICAL
  { name: 'Finolex 2.5 Sq.mm FR Wire 90m', category: 'Electrical', price: 1850, stock: 100, unit: 'coil', weight: '8kg', brand: 'Finolex', featured: true, description: 'Flame retardant PVC insulated copper wire for household wiring. 90-meter coil. IS:694 certified.', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80' },
  { name: 'Havells 6A Modular Switch', category: 'Electrical', price: 225, stock: 9, unit: 'piece', weight: '50g', brand: 'Havells', featured: false, description: 'Premium modular 6A one-way switch with polycarbonate body. Shock resistant. 5-year warranty.', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80' },

  // PAINT
  { name: 'Asian Paints Apex UltiForte 20L', category: 'Paint', price: 4800, stock: 50, unit: 'can', weight: '20L', brand: 'Asian Paints', featured: true, description: 'Ultra-premium exterior emulsion with 10-year warranty. Waterproof, anti-algae, 100% acrylic.', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80' },
  { name: 'Berger WeatherCoat Anti Dustt 10L', category: 'Paint', price: 2200, stock: 80, unit: 'can', weight: '10L', brand: 'Berger', featured: false, description: 'Dust repellent exterior paint with anti-carbonation properties. 7-year performance guarantee.', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80' },

  // TOOLS
  { name: 'Bosch GWS 850 Angle Grinder', category: 'Tools', price: 2800, stock: 30, unit: 'piece', weight: '2.3kg', brand: 'Bosch', featured: true, description: '850W professional angle grinder with 4.5" disc. Variable speed, spindle lock. 1-year warranty.', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80' },
  { name: 'Stanley STHT77403 Tape 5m', category: 'Tools', price: 350, stock: 200, unit: 'piece', weight: '250g', brand: 'Stanley', featured: false, description: 'PowerLock 5m measuring tape with auto-lock and magnetic tip. Blade thickness 0.13mm.', image: 'https://images.unsplash.com/photo-1590402494684-92fa0d63fdca?w=600&q=80' },

  // SAFETY
  { name: 'Karam ISI Safety Helmet', category: 'Safety', price: 250, stock: 9, unit: 'piece', weight: '350g', brand: 'Karam', featured: false, description: 'ISI marked HDPE safety helmet with ratchet adjustment. Impact resistant outer shell. EN 397 certified.', image: 'https://images.unsplash.com/photo-1578020190125-f4f7c18bc9cb?w=600&q=80' },
  { name: 'Mallcom Cut-Resistant Gloves', category: 'Safety', price: 320, stock: 5, unit: 'pair', weight: '200g', brand: 'Mallcom', featured: false, description: 'Level 5 cut-resistant gloves with leather palm and EN388 certification. Orange hi-vis design.', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80' },
];

const customerNames = ['Rajesh Sharma', 'Priya Mehta', 'Amit Patel', 'Sanjay Gupta', 'Deepak Verma', 'Kavita Singh', 'Rohit Joshi', 'Neha Agarwal', 'Vikram Nair', 'Pooja Rao'];
const deliveryAddresses = [
  'Plot 45, Andheri East Construction Site, Mumbai - 400069',
  'Shivaji Nagar Building Site, Worli, Mumbai - 400018',
  'Under Construction Bldg, Bandra West, Mumbai - 400050',
  'New Wing Extension, Powai Tech Park, Mumbai - 400076',
  'Tower B Construction, Thane West, Thane - 400601',
  'Society Renovation Site, Vile Parle, Mumbai - 400057',
  'Commercial Complex Site, Goregaon East, Mumbai - 400063',
  'Residential Project, Kandivali West, Mumbai - 400067',
  'Infrastructure Site, Belapur, Navi Mumbai - 400614',
  'Mall Construction, Dadar TT Circle, Mumbai - 400028',
];

const statuses = ['Placed', 'Confirmed', 'Packed', 'Dispatched', 'Out for Delivery', 'Delivered', 'Delivered', 'Delivered', 'Out for Delivery', 'Confirmed'];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/homex');
    console.log('✅ Connected to MongoDB');

    // Clear collections
    await Promise.all([
      Product.deleteMany({}),
      Order.deleteMany({}),
      Rider.deleteMany({}),
      User.deleteMany({}),
    ]);

    // ── Seed Products ──────────────────────────────────────────────────────────
    const savedProducts = await Product.insertMany(products);
    console.log(`✅ Seeded ${savedProducts.length} products`);

    // ── Seed Riders ────────────────────────────────────────────────────────────
    const savedRiders = await Rider.insertMany(riders);
    console.log(`✅ Seeded ${savedRiders.length} riders`);

    // ── Seed Users (Admin + Rider accounts) ────────────────────────────────────
    // NOTE: Do NOT pre-hash passwords here. The User model's pre('save') hook
    // handles hashing automatically. Pre-hashing + the hook = double-hash = login broken.
    const adminUser = await User.create({
      name: 'HomeX Admin',
      email: 'admin@homex.in',
      password: 'admin123',
      role: 'admin',
    });

    const riderUser = await User.create({
      name: savedRiders[0].name,
      email: 'rider@homex.in',
      password: 'rider123',
      role: 'rider',
      riderId: savedRiders[0]._id,
    });

    console.log(`✅ Seeded 2 users`);
    console.log(`   Admin → admin@homex.in / admin123`);
    console.log(`   Rider → rider@homex.in / rider123`);

    // ── Seed Orders (with ObjectId rider refs) ─────────────────────────────────
    const orderData = [];
    for (let i = 0; i < 10; i++) {
      const numItems = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...savedProducts].sort(() => Math.random() - 0.5);
      const items = shuffled.slice(0, numItems).map(p => ({
        product: p._id,
        name: p.name,
        price: p.price,
        quantity: Math.floor(Math.random() * 5) + 1,
        image: p.image,
      }));
      const totalAmount = items.reduce((s, item) => s + item.price * item.quantity, 0);
      const status = statuses[i];
      const riderRef = savedRiders[i % 3]._id;

      orderData.push({
        orderId: `HX-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
        items,
        totalAmount,
        status,
        paymentStatus: status === 'Delivered' ? 'Paid' : 'Pending',
        assignedRider: riderRef,
        customerName: customerNames[i],
        customerPhone: `+91 ${Math.floor(70000 + Math.random() * 29999)}${Math.floor(10000 + Math.random() * 89999)}`,
        deliveryAddress: deliveryAddresses[i],
        deliveryTimeEstimate: '45 minutes',
        createdAt: daysAgo(Math.floor(Math.random() * 7)),
        notes: i % 3 === 0 ? 'Please deliver before 5 PM' : '',
        statusHistory: [{ status: 'Placed' }, ...(status !== 'Placed' ? [{ status }] : [])],
      });
    }

    await Order.insertMany(orderData);
    console.log(`✅ Seeded ${orderData.length} orders`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('  → Products:', savedProducts.length);
    console.log('  → Riders:  ', savedRiders.length);
    console.log('  → Users:    2 (admin + rider)');
    console.log('  → Orders:  ', orderData.length);
    console.log('\n📋 Demo Credentials:');
    console.log('  Admin:   admin@homex.in   | admin123');
    console.log('  Rider:   rider@homex.in   | rider123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

seed();
