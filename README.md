# Tmanina - Islamic Web Application

A comprehensive Islamic web application built with Next.js, featuring Quran reading, prayer times, Islamic calendar, Adhkar, and more.

## Features

- 📖 Quran Reader with Mushaf-style layout
- 🎧 Audio Quran with multiple reciters
- 📻 Islamic Radio stations
- 🕌 Prayer times and Qibla direction
- 📅 Islamic Calendar
- 🤲 Daily Adhkar (morning & evening)
- 📚 Hadith Encyclopedia
- 🌙 Dark mode support
- 📱 Progressive Web App (PWA)

## Getting Started

### Development

Run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building

Build the application for production:

```bash
npm run build:gh
```

This creates an optimized static export in the `out/` directory.

## Deployment

We use a **dual-environment deployment strategy**:

- **Staging**: Test changes at https://tmanina.github.io/tmanina_staging (from `staging` branch)
- **Production**: Live site (from `main` branch)

### Quick Deployment Guide

**To deploy to staging:**
```bash
git checkout staging
git add .
git commit -m "Your changes"
git push origin staging
```

**To deploy to production:**
```bash
git checkout main
git merge staging
git push origin main
```

For detailed deployment instructions, troubleshooting, and best practices, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Project Structure

- `/src` - Application source code
  - `/app` - Next.js app router pages
  - `/components` - React components
  - `/lib` - Utility functions and helpers
- `/public` - Static assets
- `/.github/workflows` - GitHub Actions deployment workflows

## Technologies

- **Framework**: Next.js 13.5.4 (Static Export)
- **UI**: React 18 with Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Prayer Times**: Adhan library

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Contributing

1. Create a feature branch from `staging`
2. Make your changes
3. Test thoroughly in local development
4. Push to staging and test on the staging site
5. Once verified, merge to main for production deployment

## License

This project is private and maintained by tmanina.
