# RECOMMENDATION: Shop Feature & Payment Gateway Integration

**Status**: Untuk implementasi di fase berikutnya (Priority 4-5)

---

## Priority 4: Shop Feature (Kewirausahaan Bidang)

### Recommended Architecture:

```
/src/app/shop
├── page.js                    # Shop homepage + product listing
├── [productId]
│   └── page.js               # Product detail page
├── cart
│   └── page.js               # Shopping cart
└── checkout
    └── page.js               # Payment & order

/src/app/api/shop
├── products
│   ├── route.js              # GET/POST products
│   └── [id]
│       └── route.js          # GET/PUT/DELETE single product
├── orders
│   ├── route.js              # GET orders, POST create order
│   └── [id]
│       └── route.js          # GET order detail, PUT update status
├── cart
│   └── route.js              # GET/POST cart items
└── payments
    └── [provider]            # Payment provider webhooks
        └── route.js

/src/app/admin/shop
├── products
│   ├── page.js               # Product management list
│   ├── [id]
│   │   └── page.js           # Edit product
│   └── create
│       └── page.js           # Create new product
└── orders
    └── page.js               # Order management & tracking
```

### Database Schema (Migrations):

```sql
-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  stock INT DEFAULT 0,
  category VARCHAR(100),
  image_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Shopping Carts
CREATE TABLE carts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  product_id UUID REFERENCES products(id),
  quantity INT,
  created_at TIMESTAMP
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  total_amount DECIMAL(12, 2),
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, processing, completed, cancelled
  payment_method VARCHAR(50),
  payment_ref VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  quantity INT,
  price DECIMAL(12, 2),
  created_at TIMESTAMP
);
```

---

## Priority 5: Payment Gateway Integration

### Recommended: **TRIPAY** ⭐

**Why Tripay?**
- ✅ QRIS native support (auto-generate per transaction)
- ✅ Minimal admin overhead (built-in dashboard)
- ✅ Indonesia-first (support Rp currency natively)
- ✅ Multiple payment methods (bank transfer, E-wallet, QRIS)
- ✅ Webhook support for real-time updates
- ✅ Developer-friendly API
- ✅ No complex setup

### Setup Steps:

1. **Sign up**: https://tripay.co.id
2. **Get credentials**: API Key, Merchant Code, Private Key
3. **Whitelist domain**: Add your domain to Tripay dashboard
4. **Test mode**: Use provided sandbox keys first

### Implementation Example:

```javascript
// /src/app/api/shop/payments/tripay/route.js

export async function POST(request) {
  const { orderId, amount, method } = await request.json();

  const TRIPAY_KEY = process.env.TRIPAY_API_KEY;
  const TRIPAY_MERCHANT = process.env.TRIPAY_MERCHANT_CODE;

  const payload = {
    method, // 'QRIS', 'BANK_TRANSFER', 'EWALLET'
    merchant_ref: orderId,
    amount,
    customer_name: 'Customer Name',
    customer_email: 'customer@email.com',
    customer_phone: '08123456789',
    order_items: [
      { sku: 'ITEM1', name: 'Item Name', quantity: 1, price: amount }
    ],
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/shop/checkout/success`,
    expired_time: 3600, // 1 hour
    signature: generateSignature(payload, TRIPAY_KEY)
  };

  const response = await fetch('https://api.tripay.co.id/transaction/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TRIPAY_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return response.json();
}

// Webhook handler for payment confirmation
export async function PUT(request) {
  const body = await request.json();
  
  // Verify signature
  if (!verifyTripaySignature(body, process.env.TRIPAY_PRIVATE_KEY)) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Update order status based on payment status
  if (body.status === 'PAID') {
    // Mark order as paid in database
    // Send confirmation email
    // Update product stock
  }

  return new Response('OK', { status: 200 });
}
```

### Alternative Payment Gateways:

1. **Doku** - More enterprise, good for scale
   - Support: bank transfer, e-wallet, QRIS
   - Admin: Full-featured dashboard
   - Cost: Komisi per transaksi

2. **Manual QRIS** - Zero gateway cost
   - Generate QR via bank API (BNI, BCA)
   - Manual webhook handling
   - Suitable: Small scale, technical team available

---

## Required Environment Variables:

```bash
# Tripay
TRIPAY_API_KEY=your_api_key
TRIPAY_MERCHANT_CODE=your_merchant_code
TRIPAY_PRIVATE_KEY=your_private_key

# Alternative
TRIPAY_MODE=sandbox # or production
```

---

## Recommended Features:

✅ **Must Have**:
- Product catalog with categories
- Shopping cart persistence (Supabase table or localStorage)
- Checkout with QRIS payment
- Order confirmation email (via Resend)
- Admin product management

✅ **Nice to Have**:
- Product search & filter
- Wishlist functionality
- Order tracking page
- Product reviews & ratings
- Discount codes / coupons
- Inventory management
- Email notifications

---

## Estimated Effort (Priority 5):

- Database schema: 1 session
- API endpoints: 2 sessions
- Frontend UI: 3 sessions
- Payment integration: 1-2 sessions
- Testing & debugging: 1 session

**Total: ~8 sessions** (optimal untuk sprint berikutnya)

---

## Next Steps:

1. ✅ **Phase 1** (DONE): Domain updates, Voucher/Cert validation, Inventory
2. ⏳ **Phase 2**: Clarify shop requirements (categories, pricing, etc.)
3. ⏳ **Phase 3**: Setup Tripay sandbox & test integration
4. ⏳ **Phase 4**: Implement full shop + payment flow
