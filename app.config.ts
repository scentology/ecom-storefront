// Fallback store identity, used until /storefront/info answers (admin → Storefront → Shop details wins).
// Products, categories, home sections and pages all come from ecom-api.
export default defineAppConfig({
  store: {
    name: 'Scentology',
    tagline: 'Scented Your Mood',
    description: 'Fragrances and menswear, from designer and niche scents to panjabi and suits, delivered across Bangladesh.',
    phone: '+880 1700-000000',
    email: 'hello@scentology.com.bd',
    whatsapp: '8801700000000', // digits only, for wa.me links; empty hides the button
    address: 'House 1, Road 1, Gulshan, Dhaka 1212',
    social: { facebook: '', instagram: '', youtube: '' },
  },
  announcements: [
    'Fragrances and menswear, quality checked before every dispatch',
    'Free delivery inside Dhaka on orders over ৳3,000',
    'Cash on delivery all over Bangladesh',
    'Easy exchanges on sizes and colours',
  ],
})
