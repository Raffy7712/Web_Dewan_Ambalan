# 🚀 DEPLOYMENT CHECKLIST - da-alf Updates

**Last Updated**: 15 Mei 2026
**Status**: ✅ Implementation Complete for Priority 1-3 (Shop removed per request)

---

## 📋 Pre-Deployment Steps

### 1. Environment Setup
- [ ] Copy `.env.example` to `.env.local`
- [ ] Configure Supabase credentials:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Set Resend API key:
  - [ ] `RESEND_API_KEY`
  - [ ] Verify EMAIL_FROM is `noreply@mail.da-alf.my.id` (already set)
- [ ] Configure Tripay (for shop payments):
  - [ ] `TRIPAY_API_KEY`
  - [ ] `TRIPAY_MERCHANT_CODE`
  - [ ] Set `TRIPAY_MODE=sandbox` for testing

### 2. Database Migrations

**⚠️ IMPORTANT: Run in Supabase SQL Editor**

**Step 1: Deploy Voucher & Certificate Schema**
```sql
-- Copy content from: migrations/migration-v11.sql
-- Paste into: https://app.supabase.com → Project → SQL Editor
-- Click "Run"
```

**Step 2: Deploy Inventory Schema**
```sql
-- Copy content from: migrations/migration-v12.sql
-- Paste into Supabase SQL Editor
-- Click "Run"
```

**Verify**: Check each table exists in Supabase Tables view

- [ ] Go to: https://resend.com/dashboard
- [ ] Verify domain `mail.da-alf.my.id` is verified
- [ ] Copy API Key → `.env.local` RESEND_API_KEY
- [ ] Test email sending with `/api/send` endpoint

### 4. Local Testing

```bash
# Install dependencies (if not done)
npm install

# Run development server
npm run dev

# Test each feature:

# 1. Voucher & Certificate Validation
# - Go to http://localhost:3000/admin/vouchers
# - Generate voucher/certificate
# - Go to http://localhost:3000/vouchers
# - Scan/verify code

# 2. Inventory Management
# - Go to http://localhost:3000/admin/inventory
# - Create item → Add maintenance → Add check
# - Export PDF barcode

# 3. Shop
# - Go to http://localhost:3000/shop
# - Add product to cart
# - Proceed to checkout
# - Test payment with Tripay (sandbox)
```

### 6. Production Deployment

#### Option A: Vercel (Recommended for Next.js)
```bash
# 1. Push code to GitHub
git add .
git commit -m "Deploy: da-alf feature updates"
git push origin main

# 2. Connect repo to Vercel: https://vercel.com/dashboard
# 3. Add environment variables in Vercel project settings
# 4. Redeploy
```

#### Option B: Self-hosted
```bash
# 1. Build production bundle
npm run build

# 2. Set production environment variables
export NODE_ENV=production
export NEXT_PUBLIC_SUPABASE_URL=...
# ... (set all env vars)

# 3. Start production server
npm start

# 4. Use reverse proxy (nginx/apache) for SSL
```

---

## 🔍 Verification Checklist

### Database
- [ ] Voucher tables exist: `vouchers`, `certificates`, `verification_scans`
- [ ] Inventory tables exist: `inventory_items`, `maintenance_logs`, `item_checks`, `inventory_categories`
- [ ] All RLS policies enabled
- [ ] All indexes created

### APIs
- [ ] Test `/api/vouchers/generate` - Generate voucher
- [ ] Test `/api/vouchers/verify` - Verify code
- [ ] Test `/api/inventory/items` - List items
- [ ] Test `/api/inventory/export` - Export PDF
- [ ] Test `/api/shop/products` - List products
- [ ] Test `/api/shop/cart` - Add to cart
- [ ] Test `/api/shop/orders` - Create order
- [ ] Test `/api/shop/payments/tripay` - Generate QRIS payment

### Frontend Pages
- [ ] `/vouchers` - Public scanner works
- [ ] `/admin/vouchers` - Generate form works
- [ ] `/admin/inventory` - List displays
- [ ] `/admin/inventory/create` - Create form works
- [ ] `/admin/inventory/[id]` - Detail page displays
- [ ] `/admin/inventory/export` - PDF generates

### Email
- [ ] Test voucher email sent correctly

---

## 🐛 Troubleshooting

### Database Errors
```
Error: permission denied

→ Solution: Ensure RLS policies are set correctly
→ Check: Supabase → Tables → RLS → Enable all policies
```

### Email Not Sending
```
Error: 401 Unauthorized - RESEND_API_KEY

→ Solution: 
  1. Verify API key in .env.local
  2. Domain must be verified at https://resend.com/domains
  3. Current domain: mail.da-alf.my.id
```

### Payment Gateway Error
```
Error: Invalid API Key or Merchant Code

→ Solution:
  1. Double-check Tripay credentials
  2. Ensure TRIPAY_MODE matches credentials (sandbox vs production)
  3. Test at: https://tripay.co.id/documentation
```

### CORS/Webhook Issues
```
Error: CORS error when fetching API

→ Solution:
  1. Check NEXT_PUBLIC_APP_URL matches domain
  2. Webhook URL in Tripay must match: https://your-domain/api/shop/payments/tripay
  3. Verify firewall allows webhook requests
```

---

## 📚 API Documentation

### Vouchers API
```bash
# Generate voucher
POST /api/vouchers/generate
Content-Type: application/json
{
  "type": "voucher",  // or "certificate"
  "quantity": 10,
  "name": "Voucher Diskon 50K",
  "description": "Berlaku hingga 31 Des 2026",
  "expired_at": "2026-12-31T23:59:59Z"
}

# Verify voucher
POST /api/vouchers/verify
{
  "code": "VCH-2026-ABC123"
}

# Get verification history
GET /api/vouchers/verify?code=VCH-2026-ABC123
```

### Inventory API
```bash
# Create item
POST /api/inventory/items
{
  "name": "Laptop",
  "category": "elektronik",
  "location": "Gudang A",
  "quantity": 5,
  "price": 10000000
}

# Get items
GET /api/inventory/items?category=elektronik&status=baik

# Add maintenance log
POST /api/inventory/maintenance
{
  "item_id": "uuid",
  "description": "Servis berkala",
  "cost": 100000
}

# Export to PDF
GET /api/inventory/export?format=pdf&items=id1,id2,id3
```

### Shop API
```bash
# Get products
GET /api/shop/products?category=kerajinan

# Add to cart
POST /api/shop/cart
{
  "product_id": "uuid",
  "quantity": 2
}

# Create order
POST /api/shop/orders
{
  "shipping_address": "Jl. Merdeka No. 123",
  "shipping_city": "Jakarta",
  "shipping_postal_code": "12345"
}

# Generate QRIS payment
POST /api/shop/payments/tripay
{
  "order_id": "uuid"
}
```

---

## 📞 Support & Next Steps

### If Issues Occur:
1. Check error logs: `/logs/` or browser console
2. Verify all environment variables are set
3. Check Supabase tables for data integrity
4. Test APIs directly with curl or Postman

### Future Enhancements:
- [ ] Admin dashboard with analytics
- [ ] Email notifications (order confirmation, shipping updates)
- [ ] User account page (order history, wishlist)
- [ ] Product reviews & ratings
- [ ] Shipping provider integration (JNE, Sicepat)
- [ ] Inventory stock auto-decrement on order
- [ ] Promo code management interface

---

## ✅ Final Sign-Off

- [ ] All files committed to git
- [ ] Environment variables configured
- [ ] Migrations deployed to Supabase (v11, v12)
- [ ] All APIs tested and working
- [ ] Frontend pages display correctly
- [ ] Email integration configured
- [ ] Ready for production deployment

**Deployment Status**: ✅ **READY**

---

**Questions?** Check:
- `/IMPLEMENTATION_SUMMARY.md` - Feature overview
- `/migrations/SHOP_IMPLEMENTATION_GUIDE.md` - Shop specific details
- API route files in `/src/app/api/` - Implementation details
