# Employee Management System — Frontend

<!-- HR Operation EMS System — Frontend -->
<!-- Test 2: April 12, 2026 -->

A production-ready Next.js 15 frontend for the EMS NestJS backend.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand (persisted) |
| Forms | React Hook Form + Zod |
| HTTP | Axios (auto-refresh interceptor) |
| Icons | Lucide React |

## Getting Started

### 1. Configure environment
The `.env.local` file is already created. Update it if your backend runs on a different port:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 2. Start the NestJS backend first, then run:
```bash
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) (Next.js will pick port 3001 if 3000 is taken).

## Pages

| Route | Description |
|---|---|
| `/` | Portal selection (Admin / Employee) |
| `/login?portal=admin` | Admin login |
| `/login?portal=employee` | Employee login |
| `/register?portal=...` | Registration |
| `/forgot-password` | Request password reset |
| `/reset-password?token=...` | Set new password |
| `/verify-email?token=...` | Email verification |
| `/admin/dashboard` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/profile` | Admin profile |
| `/employee/dashboard` | Employee dashboard |
| `/employee/profile` | Employee profile |

## Production

```bash
npm run build
npm start
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
