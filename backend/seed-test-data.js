/**
 * Seed script to add comprehensive test data
 * Run with: node seed-test-data.js
 */

const db = require('./models');
const bcrypt = require('bcryptjs');

const seedTestData = async () => {
    try {
        console.log('🌱 Starting to seed test data...');

        // 2. Create Test Users
        console.log('👤 Creating test users...');

        // Create Admin user
        let admin = await db.admins.findOne({ where: { username: 'admin12' } });
        if (!admin) {
            admin = await db.admins.create({
                username: 'admin12',
                password: bcrypt.hashSync('1212', 8),
                email: 'admin@balkrishna.com',
                role: 'admin'
            });
            console.log('✅ Admin user created: admin12/1212');
        } else {
            console.log('✅ Admin user already exists: admin12/1212');
        }

        // Create Staff user
        let staff = await db.admins.findOne({ where: { username: 'staff1' } });
        if (!staff) {
            staff = await db.admins.create({
                username: 'staff1',
                password: bcrypt.hashSync('staff123', 8),
                email: 'staff1@balkrishna.com',
                role: 'staff'
            });
            console.log('✅ Staff user created: staff1/staff123');
        } else {
            console.log('✅ Staff user already exists: staff1/staff123');
        }

        // 3. Create Companies
        console.log('🏢 Creating companies...');
        const companies = [];
        const companyNames = ['Diamond Corp', 'Jewel House', 'Gem Palace', 'Royal Diamonds', 'Crystal Traders'];

        for (const name of companyNames) {
            let company = await db.companies.findOne({ where: { name } });
            if (!company) {
                company = await db.companies.create({
                    name,
                    gst_no: `GST${Math.floor(Math.random() * 1000000)}`,
                    address: `${Math.floor(Math.random() * 100)} Business St, Mumbai`,
                    mobile: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                    created_by: admin.id
                });
            }
            companies.push(company);
        }
        console.log(`✅ Created ${companies.length} companies`);

        // 4. Create Clients/Buyers
        console.log('👥 Creating clients...');
        const clients = [];
        const clientNames = [
            'Rajesh Kumar', 'Priya Patel', 'Amit Shah', 'Sneha Gupta', 'Vikram Singh',
            'Neha Sharma', 'Arjun Reddy', 'Pooja Joshi', 'Ravi Verma', 'Anita Desai'
        ];

        for (const name of clientNames) {
            let client = await db.clients.findOne({ where: { name } });
            if (!client) {
                client = await db.clients.create({
                    name,
                    email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
                    contact_number: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                    address: `${Math.floor(Math.random() * 500)} Residential Area`,
                    city: 'Delhi',
                    country: 'India',
                    currency: 'INR',
                    created_by: admin.id
                });
            }
            clients.push(client);
        }
        console.log(`✅ Created ${clients.length} clients`);

        // 5. Create Sellers
        console.log('💎 Creating sellers...');
        const sellers = [];
        const sellerData = [
            { name: 'ABC Diamonds', company: 'ABC Diamond Corp' },
            { name: 'XYZ Gems', company: 'XYZ Gemstones Ltd' },
            { name: 'Premium Stones', company: 'Premium Trading Co' },
            { name: 'Global Diamonds', company: 'Global Diamond Supply' },
            { name: 'Elite Gems', company: 'Elite Gem House' }
        ];

        for (const sellerInfo of sellerData) {
            let seller = await db.sellers.findOne({ where: { name: sellerInfo.name } });
            if (!seller) {
                seller = await db.sellers.create({
                    name: sellerInfo.name,
                    company: sellerInfo.company,
                    email: `${sellerInfo.name.toLowerCase().replace(' ', '.')}@supplier.com`,
                    mobile: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                    address: `${Math.floor(Math.random() * 200)} Diamond District, Surat`,
                    gst_no: `GST${Math.floor(Math.random() * 1000000)}`,
                    created_by: admin.id
                });
            }
            sellers.push(seller);
        }
        console.log(`✅ Created ${sellers.length} sellers`);

        // 6. Create Diamonds
        console.log('💍 Creating diamonds...');
        const diamonds = [];
        const shapes = ['Round', 'Princess', 'Emerald', 'Oval', 'Cushion'];
        const colors = ['D', 'E', 'F', 'G', 'H', 'I', 'J'];
        const clarities = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'];

        // Get count of existing diamonds
        const existingCount = await db.diamonds.count();

        // Create 50 diamonds total
        const neededCount = Math.max(0, 50 - existingCount);
        const startId = existingCount + 1000;

        for (let i = 0; i < neededCount; i++) {
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const clarity = clarities[Math.floor(Math.random() * clarities.length)];
            const carat = (Math.random() * 2 + 0.5).toFixed(2);
            const price = parseFloat((carat * (Math.random() * 2000 + 3000)).toFixed(2));
            const seller = sellers[Math.floor(Math.random() * sellers.length)];
            const createdBy = Math.random() > 0.5 ? admin.id : staff.id;

            const diamond = await db.diamonds.create({
                stock_id: `DIA${startId + i}`,
                shape,
                carat: parseFloat(carat),
                color,
                clarity,
                price,
                certificate: `GIA${startId + i}${Math.floor(Math.random() * 1000000)}`,
                seller_id: seller.id,
                status: 'in_stock',
                purchase_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
                created_by: createdBy
            });

            diamonds.push(diamond);
        }
        console.log(`✅ Created ${neededCount} new diamonds (total: ${existingCount + neededCount})`);

        // Get all available diamonds
        const allDiamonds = await db.diamonds.findAll({ where: { status: 'in_stock' } });

        // 7. Create Invoices with different statuses
        console.log('📄 Creating invoices...');
        const invoices = [];
        const currencies = ['USD', 'INR'];
        const statuses = ['paid', 'partial', 'pending'];

        for (let i = 0; i < Math.min(30, allDiamonds.length); i++) {
            const client = clients[Math.floor(Math.random() * clients.length)];
            const company = companies[Math.floor(Math.random() * companies.length)];
            const currency = currencies[Math.floor(Math.random() * currencies.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const createdBy = Math.random() > 0.5 ? admin.id : staff.id;

            // Get 1-2 available diamonds
            const numDiamonds = Math.min(Math.floor(Math.random() * 2) + 1, allDiamonds.length);
            const invoiceDiamonds = allDiamonds.splice(0, numDiamonds);

            if (invoiceDiamonds.length === 0) break;

            const subtotal = invoiceDiamonds.reduce((sum, d) => sum + d.price, 0);
            const tax = subtotal * 0.05;
            const grandTotal = subtotal + tax;

            let paid = 0;
            if (status === 'paid') {
                paid = grandTotal;
            } else if (status === 'partial') {
                paid = grandTotal * (Math.random() * 0.5 + 0.3);
            }

            const invoice = await db.invoices.create({
                invoice_number: `INV-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
                invoice_date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
                client_id: client.id,
                company_id: company.id,
                buyer_name: client.name,
                buyer_address: client.address,
                buyer_mobile: client.mobile,
                subtotal,
                tax,
                grand_total: grandTotal,
                paid_amount: paid,
                balance_due: grandTotal - paid,
                payment_status: status,
                currency,
                exchange_rate: currency === 'INR' ? 83.0 : 1.0,
                created_by: createdBy
            });

            // Add invoice items and mark diamonds as sold
            for (const diamond of invoiceDiamonds) {
                await db.invoiceItems.create({
                    invoice_id: invoice.id,
                    stock_id: diamond.stock_id,
                    description: `${diamond.carat}ct ${diamond.shape} ${diamond.color} ${diamond.clarity}`,
                    quantity: 1,
                    unit_price: diamond.price,
                    total: diamond.price
                });

                diamond.status = 'sold';
                await diamond.save();
            }

            invoices.push(invoice);
        }
        console.log(`✅ Created ${invoices.length} invoices`);

        // 8. Create Seller Payments
        console.log('💰 Creating seller payments...');
        let paymentsCount = 0;

        for (const seller of sellers) {
            const sellerDiamonds = await db.diamonds.findAll({ where: { seller_id: seller.id } });
            const totalPurchased = sellerDiamonds.reduce((sum, d) => sum + d.price, 0);

            if (totalPurchased > 0) {
                const numPayments = Math.floor(Math.random() * 3) + 1;

                for (let i = 0; i < numPayments; i++) {
                    const paymentAmount = totalPurchased / (numPayments + 1);

                    await db.sellerPayments.create({
                        seller_id: seller.id,
                        amount: paymentAmount,
                        payment_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                        payment_method: ['cash', 'bank_transfer', 'cheque'][Math.floor(Math.random() * 3)],
                        reference_number: `PAY-${Date.now()}-${i}`,
                        notes: `Payment ${i + 1} for diamonds`,
                        created_by: admin.id
                    });
                    paymentsCount++;
                }
            }
        }
        console.log(`✅ Created ${paymentsCount} seller payments`);

        console.log('\n🎉 Test data seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Users: admin12/1212 (admin), staff1/staff123 (staff)`);
        console.log(`   - Companies: ${companies.length}`);
        console.log(`   - Clients: ${clients.length}`);
        console.log(`   - Sellers: ${sellers.length}`);
        console.log(`   - Diamonds: ${existingCount + neededCount}`);
        console.log(`   - Invoices: ${invoices.length}`);
        console.log(`   - Seller Payments: ${paymentsCount}`);
        console.log('\n✨ You can now test the reports with different filters!');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
};

// Run the seed function
seedTestData();
