# SiteCraft Branding System

This directory contains the centralized branding configuration for the entire SiteCraft platform.

## 📁 Directory Structure

```
shared/branding/
├── index.js              # Main branding configuration
├── assets/              # Logo files and brand assets
│   ├── logo-light.png   # Logo for light backgrounds
│   ├── logo-dark.png    # Logo for dark backgrounds  
│   ├── logo-pdf.png     # High-res logo for PDFs
│   └── favicon.ico      # Website favicon
├── css/                 # Generated CSS variables
│   └── variables.css    # CSS custom properties
└── README.md           # This file

```

## 🎨 Customizing Your Brand

### 1. Update Company Information
Edit `index.js` and modify the `company` section:

```javascript
company: {
  name: "Your Company Name",
  tagline: "Your Company Tagline", 
  website: "https://yourcompany.com",
  email: "contact@yourcompany.com"
}
```

### 2. Add Your Logo Files
Place your logo files in the `assets/` directory:
- `logo-light.png` - Logo for light backgrounds (recommended: 200x67px)
- `logo-dark.png` - Logo for dark backgrounds (recommended: 200x67px)
- `logo-pdf.png` - High-resolution logo for PDFs (recommended: 300x100px)
- `favicon.ico` - Website favicon (16x16px, 32x32px)

### 3. Customize Colors
Update the color palette in the `colors` section to match your brand:

```javascript
colors: {
  primary: {
    500: "#your-primary-color"  // Main brand color
  },
  secondary: {
    500: "#your-secondary-color" // Secondary brand color
  }
}
```

### 4. Configure Typography
Customize fonts in the `typography` section:

```javascript
typography: {
  fonts: {
    primary: {
      name: "Your Font Name",
      fallback: "Arial, sans-serif"
    }
  }
}
```

## 🔧 Usage

### Frontend (React)
```javascript
import branding from '../../shared/branding';

// Use colors
const primaryColor = branding.colors.primary[500];

// Use company info
const companyName = branding.company.name;
```

### Backend (PDF Generation)
```javascript
const branding = require('../../shared/branding');

// Use in PDF components
const logoPath = path.join(__dirname, '../../shared/branding/assets', branding.logo.primary.pdf);
const brandColor = branding.colors.primary[500];
```

### CSS Variables
Include the generated CSS variables:
```css
@import '../shared/branding/css/variables.css';

.my-component {
  color: var(--brand-primary-500);
  font-family: var(--brand-font-primary);
}
```

## 🎯 What This Affects

When you update the branding configuration, it automatically affects:

✅ **Website Frontend**
- Header logo and navigation
- Color scheme and typography
- Footer branding and links

✅ **PDF Reports** 
- Cover page design and logo
- Brand colors throughout document
- Company information in headers/footers

✅ **Email Templates**
- Logo and branding in email signatures
- Consistent color scheme

✅ **Marketing Materials**
- Consistent brand presentation
- Professional appearance

## 🚀 Best Practices

1. **Logo Formats**: Use PNG for web, SVG for scalability, high-res PNG for PDFs
2. **Color Accessibility**: Ensure sufficient contrast ratios (4.5:1 minimum)
3. **Typography**: Limit to 2-3 font families maximum  
4. **Consistency**: Use the same brand elements across all materials
5. **Testing**: Test branding changes across all platforms before deploying

## 🔄 Updating Process

1. Edit `shared/branding/index.js`
2. Add any new logo files to `assets/`
3. Restart backend server
4. Rebuild frontend if needed
5. Test PDF generation with new branding
6. Verify all brand elements display correctly

This centralized approach ensures consistent branding across your entire SiteCraft installation while making it easy to customize for your organization.