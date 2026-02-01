/**
 * Create seller-specific test data
 * This script creates diamonds from different sellers and payments
 */

const db = require('./models');

const createSellerData = async () => {
    try {
        console.log('🔷 Creating seller-specific test data...\n');

        // Get admin user
        const admin = await db.admins.findOne({ where: { username: 'admin12' } });
        if (!admin) {
            console.error('❌ Admin user not found. Run seed-test-data.js first.');
            process.exit(1);
        }

        // Get all sellers
        const sellers = await db.sellers.findAll();
        if (sellers.length === 0) {
            console.error('❌ No sellers found. Run seed-test-data.js first.');
            process.exit(1);
        }

        console.log(`✅ Found ${sellers.length} sellers:\n`);
        sellers.forEach((s, i) => {
            console.log(`   ${i + 1}. ${s.name} (${s.company})`);
        });
        console.log('');

        // Create diamonds for each seller
        const shapes = ['Round', 'Princess', 'Emerald', 'Oval', 'Cushion', 'Marquise', 'Pear'];
        const colors = ['D', 'E', 'F', 'G', 'H', 'I', 'J'];
        const clarities = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'];

        let diamondCount = 0;
        const sellerPurchases = {};

        for (const seller of sellers) {
            const numDiamonds = Math.floor(Math.random() * 8) + 5; // 5-12 diamonds per seller
            sellerPurchases[seller.id] = {
                name: seller.name,
                diamonds: [],
                totalCost: 0
            };

            console.log(`💎 Creating ${numDiamonds} diamonds for ${seller.name}...`);

            for (let i = 0; i < numDiamonds; i++) {
                const shape = shapes[Math.floor(Math.random() * shapes.length)];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const clarity = clarities[Math.floor(Math.random() * clarities.length)];
                const carat = (Math.random() * 2.5 + 0.3).toFixed(2);
                const pricePerCarat = Math.floor(Math.random() * 3000 + 2000);
                const price = parseFloat((carat * pricePerCarat).toFixed(2));

                const diamond = await db.diamonds.create({
                    stock_id: `DIA-${seller.name.substring(0, 3).toUpperCase()}-${Date.now()}-${i}`,
                    shape,
                    carat: parseFloat(carat),
                    color,
                    clarity,
                    price,
                    certificate: `GIA${Date.now()}${seller.id}${i}${Math.floor(Math.random() * 10000)}`,
                    seller_id: seller.id,
                    status: 'in_stock',
                    purchase_date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
                    created_by: admin.id,
                    quantity: 1,
                    discount: 0,
                    payment_status: 'unpaid',
                    currency: 'USD',
                    exchange_rate: 1.0,
                    sale_type: 'STOCK'
                });

                sellerPurchases[seller.id].diamonds.push(diamond);
                sellerPurchases[seller.id].totalCost += price;
                diamondCount++;
            }

            console.log(`   ✅ Created ${numDiamonds} diamonds (Total: $${sellerPurchases[seller.id].totalCost.toFixed(2)})\n`);
        }

        console.log(`\n💰 Creating seller payments...\n`);

        // Create partial payments for each seller
        let paymentCount = 0;
        for (const seller of sellers) {
            const totalPurchased = sellerPurchases[seller.id].totalCost;
            const numPayments = Math.floor(Math.random() * 3) + 2; // 2-4 payments per seller
            let totalPaid = 0;

            console.log(`   Processing ${seller.name} (Total Purchase: $${totalPurchased.toFixed(2)})`);

            for (let i = 0; i < numPayments; i++) {
                // Pay between 20-40% of total in each payment, leaving some outstanding
                const paymentPercentage = Math.random() * 0.2 + 0.15; // 15-35%
                const paymentAmount = parseFloat((totalPurchased * paymentPercentage).toFixed(2));

                // Don't overpay
                if (totalPaid + paymentAmount > totalPurchased * 0.85) {
                    break;
                }

                const payment = await db.sellerPayments.create({
                    seller_id: seller.id,
                    amount: paymentAmount,
                    payment_date: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000),
                    payment_method: ['Cash', 'Bank Transfer', 'Cheque', 'Wire Transfer'][Math.floor(Math.random() * 4)],
                    reference_number: `PAY-${seller.name.substring(0, 3).toUpperCase()}-${Date.now()}-${i}`,
                    notes: `Payment ${i + 1} for diamond purchases`,
                    created_by: admin.id
                });

                totalPaid += paymentAmount;
                paymentCount++;
            }

            const outstanding = totalPurchased - totalPaid;
            console.log(`      Payments: ${paymentCount} | Paid: $${totalPaid.toFixed(2)} | Outstanding: $${outstanding.toFixed(2)}`);
        }

        console.log('\n\n📊 ===== SUMMARY =====');
        console.log(`   Total Diamonds Created: ${diamondCount}`);
        console.log(`   Total Payments Created: ${paymentCount}`);
        console.log(`   Sellers with Data: ${sellers.length}\n`);

        console.log('📋 Seller Purchase Summary:');
        console.log('─'.repeat(80));
        for (const seller of sellers) {
            const data = sellerPurchases[seller.id];
            const payments = await db.sellerPayments.findAll({ where: { seller_id: seller.id } });
            const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
            const outstanding = data.totalCost - totalPaid;

            console.log(`\n${seller.name} (${seller.company})`);
            console.log(`   Diamonds: ${data.diamonds.length} stones`);
            console.log(`   Total Cost: $${data.totalCost.toFixed(2)}`);
            console.log(`   Paid: $${totalPaid.toFixed(2)} (${((totalPaid / data.totalCost) * 100).toFixed(1)}%)`);
            console.log(`   Outstanding: $${outstanding.toFixed(2)}`);
            console.log(`   Status: ${outstanding > 0 ? '⚠️  HAS DUE' : '✅ FULLY PAID'}`);
        }
        console.log('\n' + '─'.repeat(80));

        console.log('\n\n🎉 Seller-specific test data created successfully!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Login as admin12 / 1212');
        console.log('   2. Navigate to Sellers → Reports');
        console.log('   3. Check "Purchases" tab - verify each seller shows correct data');
        console.log('   4. Check "Payments" tab - verify payment history');
        console.log('   5. Check "Overdue" tab - verify sellers with outstanding balances');
        console.log('   6. Test "Export to Excel" for each seller-specific report');
        console.log('');

    } catch (error) {
        console.error('\n❌ Error creating seller data:', error);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
};

// Run the function
createSellerData();
