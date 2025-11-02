# Whisperrauth Documentation

This directory contains the documentation for Whisperrauth, designed to be deployed to GitHub Pages.

## 📚 Documentation Structure

```
docs/
├── index.html              # Homepage with features overview
├── guides/
│   ├── getting-started.html    # Installation and setup guide
│   ├── architecture.html       # System architecture documentation
│   └── security.html           # Security model and encryption details
├── api/
│   └── index.html             # API reference
└── assets/
    ├── style.css              # Responsive CSS styling
    └── script.js              # Interactive JavaScript features
```

## 🚀 Local Development

To view the documentation locally:

```bash
# From the docs/ directory
python3 -m http.server 8080

# Or use any static file server
npx serve
```

Then open http://localhost:8080 in your browser.

## 🌐 GitHub Pages Deployment

The documentation is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

The deployment workflow is configured in `.github/workflows/deploy-docs.yml`.

### Manual Deployment

If you need to deploy manually:

1. Go to your repository settings
2. Navigate to Pages section
3. Select the branch and `/docs` folder as the source
4. Save and wait for deployment

## 🎨 Styling and UI

The documentation uses:
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Modern UI**: Clean, accessible interface with smooth animations
- **Color Scheme**: Purple gradient hero with light background
- **Typography**: System font stack for optimal performance
- **Icons**: Emoji icons for visual appeal

## 📝 Content Guidelines

When adding or updating documentation:

1. **Use Consistent Structure**: Follow the existing page templates
2. **Include Code Examples**: Provide clear, runnable examples
3. **Add Navigation**: Ensure all pages are linked from the navbar
4. **Security First**: Always highlight security considerations
5. **User-Friendly**: Write for developers of all skill levels

## 🔧 Customization

### Changing Colors

Edit `assets/style.css`:
```css
:root {
    --primary-color: #3b82f6;
    --secondary-color: #10b981;
    /* Add more variables */
}
```

### Adding New Pages

1. Create HTML file in appropriate directory
2. Copy structure from existing page
3. Update navigation in all pages
4. Add link from homepage if needed

## 📱 Responsive Breakpoints

- **Desktop**: > 768px
- **Tablet/Mobile**: ≤ 768px

## ✨ Features

- **Copy Code Buttons**: Automatically added to all code blocks
- **Smooth Scrolling**: For anchor links
- **Active Nav Links**: Automatically highlights current page
- **Accessible**: WCAG compliant color contrast and structure
- **SEO Ready**: Proper meta tags and semantic HTML

## 🔗 Links

- [Live Documentation](https://whisperrnote.github.io/pass/)
- [GitHub Repository](https://github.com/whisperrnote/pass)
- [Main README](../README.md)

## 📄 License

Same as the main project (MIT).
