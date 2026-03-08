# 🏠 FirstCape Estate Management Website

Professional property management website for FirstCape Estate Management in Ghana.

![Website Status](https://img.shields.io/badge/status-live-success)
![Deployment](https://img.shields.io/badge/deployment-cloudflare_pages-orange)
![License](https://img.shields.io/badge/license-proprietary-blue)

## 🌐 Live Site

**Production:** [https://firstcapeestatemanagement.com](https://firstcapeestatemanagement.com)  
**Staging:** [https://firstcape.pages.dev](https://firstcape.pages.dev)

---

## 📋 About

FirstCape Estate Management is a Ghana-based property management and real estate services provider specializing in:

- Tenant placement and screening
- Rent management and collection
- Diaspora property oversight
- Professional sales support
- Property maintenance coordination
- Transparent reporting and analytics

---

## ✨ Features

### 🏘️ Property Listings
- **Buy Properties:** Browse properties for sale across Ghana
- **Rent Properties:** Find rental properties in prime locations
- **Advanced Filtering:** Filter by location, price, type, bedrooms
- **Detailed Views:** Comprehensive property information and images

### ⭐ User Features
- **Favorites System:** Save properties for later viewing
- **Property Comparison:** Compare up to 4 properties side-by-side
- **Property Alerts:** Get notified of new listings matching criteria
- **Analytics Dashboard:** Track your property viewing history

### 🎨 Design
- **Color Scheme:** Bright yellow (#FACC15) + dark grey (#374151)
- **Responsive:** Fully mobile-friendly
- **Modern UI:** Clean, professional interface
- **Fast Loading:** Optimized for performance

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with custom theme
- **JavaScript (ES6+)** - Interactive features
- **Bootstrap 5** - Responsive framework

### Backend/Data
- **Airtable** - Property database and management
- **LocalStorage** - Client-side data persistence

### Hosting & Deployment
- **GitHub** - Version control
- **Cloudflare Pages** - Static site hosting
- **Cloudflare CDN** - Global content delivery

---

## 📁 Project Structure

```
firstcape-website/
├── index.html                 # Homepage
├── properties.html            # Buy properties page
├── rentals.html              # Rent properties page
├── about.html                # About us page
├── contact.html              # Contact page
├── services.html             # Services page
├── landlords.html            # Landlords page
├── favorites.html            # Favorites feature
├── comparison.html           # Property comparison
├── alerts.html               # Property alerts
├── analytics.html            # Analytics dashboard
├── property-single.html      # Single property view
├── rental-single.html        # Single rental view
├── privacy-policy.html       # Privacy policy
├── terms-of-service.html     # Terms of service
├── cookie-policy.html        # Cookie policy
├── disclaimer.html           # Legal disclaimer
├── diagnostics.html          # System diagnostics
├── css/
│   ├── bootstrap.min.css     # Bootstrap framework
│   ├── style.css             # Main styles
│   ├── color-override.css    # Yellow theme
│   ├── favorites.css         # Favorites styles
│   ├── comparison.css        # Comparison styles
│   └── analytics.css         # Analytics styles
├── js/
│   ├── jquery.min.js         # jQuery library
│   ├── bootstrap.min.js      # Bootstrap JS
│   ├── config.js             # Configuration
│   ├── favorites.js          # Favorites functionality
│   ├── comparison.js         # Comparison functionality
│   ├── analytics.js          # Analytics functionality
│   ├── airtable.js           # Airtable integration
│   └── alerts-with-airtable.js # Alerts system
├── images/
│   ├── logo.png              # Site logo
│   ├── favicon.png           # Site favicon
│   └── [property images]     # Property photos
├── .gitignore                # Git ignore rules
└── README.md                 # This file
```

---

## 🚀 Deployment

### Automatic Deployment

This site automatically deploys to Cloudflare Pages when changes are pushed to the `main` branch.

**Workflow:**
1. Make changes locally or on GitHub
2. Commit and push to `main` branch
3. Cloudflare Pages automatically builds and deploys (1-2 minutes)
4. Changes are live!

### Manual Deployment

Not needed - deployment is automatic via GitHub integration.

---

## 💻 Local Development

### Prerequisites
- Modern web browser
- Text editor (VS Code recommended)
- Git (optional but recommended)

### Setup

1. **Clone the repository:**
```bash
git clone https://github.com/YOUR-USERNAME/firstcape-website.git
cd firstcape-website
```

2. **Open in browser:**
```bash
# Just open index.html in your browser
open index.html  # Mac
start index.html # Windows
xdg-open index.html # Linux
```

3. **Make changes:**
- Edit HTML, CSS, or JavaScript files
- Refresh browser to see changes

4. **Commit and push:**
```bash
git add .
git commit -m "Description of changes"
git push origin main
```

---

## 🎨 Color Scheme

### Primary Colors
- **Yellow:** `#FACC15` - Navigation, buttons, accents
- **Dark Grey:** `#374151` - Headings, text
- **Light Grey:** `#4B5563` - Body text

### Supporting Colors
- **White:** `#FFFFFF` - Backgrounds
- **Red:** `#DC2626` - Favorites badge
- **Light BG:** `#F9FAFB` - Sections

---

## 🔧 Configuration

### Airtable Integration

The site integrates with Airtable for property data.

**Configuration file:** `js/config.js`

```javascript
const FIRSTCAPE_CONFIG = {
  airtableApiKey: 'YOUR_API_KEY_HERE',
  airtableBaseId: 'YOUR_BASE_ID_HERE'
};
```

**⚠️ Important:** Never commit API keys to GitHub!
- Use environment variables in production
- Keep sensitive keys in `.gitignore`d files

---

## 📊 Features Guide

### Favorites System
- Click heart icon to save properties
- Stored in browser localStorage
- Accessible from any page
- View all favorites on dedicated page

### Property Comparison
- Add up to 4 properties to compare
- Side-by-side feature comparison
- View all details at once
- Clear comparison anytime

### Property Alerts
- Set criteria for new properties
- Get notified of matches
- Customize alert preferences
- Manage all alerts in one place

### Analytics Dashboard
- Track property views
- See search history
- Analyze preferences
- Export data

---

## 🌍 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## 📱 Mobile Responsive

Fully optimized for:
- 📱 Phones (320px+)
- 📱 Tablets (768px+)
- 💻 Laptops (1024px+)
- 🖥️ Desktops (1440px+)

---

## 🔐 Security

- ✅ HTTPS enabled (Cloudflare SSL)
- ✅ No sensitive data in client code
- ✅ Content Security Policy headers
- ✅ DDoS protection (Cloudflare)

---

## 📈 Performance

- **Load Time:** < 1s globally (Cloudflare CDN)
- **Lighthouse Score:** 90+
- **Mobile Performance:** Optimized
- **SEO:** Optimized meta tags

---

## 🤝 Contributing

This is a private project. If you have access:

1. Create a new branch
2. Make your changes
3. Test thoroughly
4. Submit pull request
5. Wait for review

---

## 📝 License

Proprietary - All rights reserved by FirstCape Estate Management

---

## 👥 Team

**FirstCape Estate Management**
- Website: [firstcapeestatemanagement.com](https://firstcapeestatemanagement.com)
- Email: enquiries@firstcape.com
- Phone: +233 59 687 1452
- Location: Abokobi, Accra, Ghana

---

## 📞 Support

For technical issues or questions:
- Create an issue in this repository
- Email: enquiries@firstcape.com

---

## 🗓️ Changelog

### Version 2.0.0 (March 2026)
- ✨ Rebranded from SmartHub to FirstCape
- 🎨 New yellow + grey color scheme
- 🚀 Deployed to Cloudflare Pages
- ⚡ Performance improvements

### Version 1.0.0 (Initial Release)
- 🏠 Property listings
- ⭐ Favorites system
- 📊 Analytics dashboard
- 🔍 Property comparison

---

## 🔮 Roadmap

### Upcoming Features
- [ ] User authentication
- [ ] Saved searches
- [ ] Email notifications
- [ ] Virtual property tours
- [ ] Payment integration
- [ ] Tenant portal
- [ ] Landlord dashboard

---

**Built with ❤️ for property owners and seekers in Ghana** 🇬🇭
