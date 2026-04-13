# Lunar - Time Management App

A modern time-management application built with [Next.js](https://nextjs.org), TypeScript, React, and Prisma. Lunar helps users organize tasks, manage schedules, and track productivity with an intuitive interface featuring maps, quizzes, and progress tracking.

## Deployment

Our project, Lunar, is deployed to the web: [Click to visit Deployed website](https://lunar-navy.vercel.app)

## Authors - Dream Team
- Frederick Brooke
- Sadhna Arun
- Deeti Babbar
- Karim He
- Joanna Rachel Jayachandran
- Alisha Kazmi
- Extreme Limbu
- Sakar Rai
- Aarushi Singh

## Features

- **Task Management**: Create, update, and track tasks with progress indicators
- **Calendar Integration**: View and manage events across your schedule (including Google calendar integration)
- **Location Mapping**: Interactive maps to visualize task locations and friend locations
- **Progress Tracking**: Visual rocket animation showing overall progress
- **Friends and Messaging**: Send and receive messages with friends directly on the app through the Messages page
- **Auto Day Scheduler**: Automatically schedules your day based on availability and tasks you've created in the app
- **Module System**: Professors and teachers can create modules and share module codes with students, allowing module-specific tasks to be added to everyone's calendar
- **Games & Rewards**: Earn coins through games and completing tasks, then spend coins on profile cosmetics in the shop
- **Authentication**: Secure user authentication with password reset functionality
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Getting Started locally

First - Copy `.env.example` and add relevant api keys (Our .env can be found in `developers-manual.pdf`)

### With Nix Flake

1. Run `nix run .#init` to initialize development environment with Node.js, dependencies, and check env variables are present

2. Run `nix run .#tests` to run the full test suite for the application and generate a coverage report

3. Run `nix run .#run` to build the app and start the app in production node locally

### Using Node and npm

1. **Environment Configuration**:
    - Install packages with `npm install`
    - Create a `.env` file in the project root (./scheduler)
    - Copy environment variables from the `developers-manual.pdf` into `.env`
   
2. **Run Test suites**
    - Bash: `npm test`

3. **Create and Run the build**
    - Create a build of the app using `npm run build`
    - Start the local instance of the app using `npm run start`
    - Open [http://localhost:3000](http://localhost:3000) with your browser

## Access Credentials 

See `developers-manual.pdf` for details on default superuser and normal user

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Mapping**: Leaflet for interactive maps
- **Backend**: Next.js API routes with TypeScript
- **Database**: MongoDB with Prisma ORM
- **Authentication**: Session-based auth with secure reset flow

### Development Guidelines

- **All database operations** should be written in `/src/app/actions.ts` or route handlers
- This ensures database access is handled server-side for security
- Use Prisma Client methods for type-safe database queries
- Database schema is defined in `/prisma/schema.prisma`

### Useful Commands

```bash
npm run type-check     # Check TypeScript types (increased Node memory)
npm jest               # Runs our test suite
npx prisma db push     # Run migrations
npx prisma studio     # Open Prisma Studio for database visualization
```

## Third-Party Dependencies & Attribution

Lunar relies heavily on the following open-source libraries and frameworks:

### Core Framework & Runtime
- **[Next.js](https://nextjs.org/)** (v16.2.1) - React framework for production with server-side rendering, API routes, and static generation. Used as the foundation for our full-stack application.
  - Repository: https://github.com/vercel/next.js
  - License: MIT

- **[React](https://react.dev/)** (v19.2.3) - JavaScript library for building user interfaces with component-based architecture.
  - Repository: https://github.com/facebook/react
  - License: MIT

- **[TypeScript](https://www.typescriptlang.org/)** - Typed superset of JavaScript providing type safety and improved developer experience.
  - Repository: https://github.com/microsoft/TypeScript
  - License: Apache 2.0

### Database & ORM
- **[Prisma](https://www.prisma.io/)** (v6.19.2) - Modern ORM for Node.js and TypeScript with type safety, migrations, and studio visualization. Handles all database interactions with MongoDB.
  - Repository: https://github.com/prisma/prisma
  - License: Apache 2.0

- **[MongoDB](https://www.mongodb.com/)** (v7.0.0) - NoSQL database used as primary data store for user data, tasks, modules, and messages.
  - Repository: https://github.com/mongodb/node-mongodb-native
  - License: Apache 2.0

### Styling & UI Components
- **[Tailwind CSS](https://tailwindcss.com/)** (v4.1.18) - Utility-first CSS framework providing responsive design and styling utilities.
  - Repository: https://github.com/tailwindlabs/tailwindcss
  - License: MIT

- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component library providing foundation for dashboard components (buttons, dialogs, dropdowns, tabs, tooltips, etc.).
  - Repository: https://github.com/radix-ui/primitives
  - License: MIT

- **[Framer Motion](https://www.framer.com/motion/)** (v12.35.0) - Motion library for React providing smooth animations including the rocket progress animation.
  - Repository: https://github.com/framer/motion
  - License: MIT

- **[Tabler Icons](https://tabler-icons.io/)** (v3.36.1) - Open-source icon library used throughout the UI for navigation and actions.
  - Repository: https://github.com/tabler/tabler-icons
  - License: MIT

- **[Lucide React](https://lucide.dev/)** (v0.563.0) - Beautiful, consistent icon library used alongside Tabler Icons.
  - Repository: https://github.com/lucide-icons/lucide
  - License: ISC

### Calendar & Scheduling
- **[FullCalendar](https://fullcalendar.io/)** (v6.1.20) - Feature-rich JavaScript calendar library providing day/week/month views for event management.
  - Repository: https://github.com/fullcalendar/fullcalendar
  - License: FullCalendar Standard License (commercial)

- **[React Big Calendar](https://react-big-calendar.js.org/)** - Event calendar component used for displaying and managing scheduled events.
  - Repository: https://github.com/jquense/react-big-calendar
  - License: MIT

- **[React Day Picker](https://react-day-picker.js.org/)** (v9.14.0) - Flexible date picker component.
  - Repository: https://github.com/gpbl/react-day-picker
  - License: MIT

### Mapping
- **[Leaflet](https://leafletjs.com/)** (v1.9.4) - Leading open-source JavaScript library for interactive maps enabling location visualization features.
  - Repository: https://github.com/Leaflet/Leaflet
  - License: BSD 2-Clause

- **[React Leaflet](https://react-leaflet.js.org/)** (v5.0.0) - React bindings for Leaflet providing declarative map component integration.
  - Repository: https://github.com/PaulLeCam/react-leaflet
  - License: MIT

### Authentication
- **[NextAuth.js](https://next-auth.js.org/)** (v4.24.13) - Authentication library for Next.js providing session-based authentication, password reset flows, and OAuth integration.
  - Repository: https://github.com/nextauthjs/next-auth
  - License: ISC

- **[bcryptjs](https://www.npmjs.com/package/bcryptjs)** (v3.0.3) - Password hashing library used for secure password storage and verification.
  - Repository: https://github.com/dcodeIO/bcrypt.js
  - License: New BSD License

### Data Management & APIs
- **[TanStack React Table](https://tanstack.com/table/latest)** (v8.21.3) - Headless table library providing powerful data management capabilities for complex data visualization.
  - Repository: https://github.com/TanStack/table
  - License: MIT

- **[Google APIs](https://www.npmjs.com/package/googleapis)** (v171.2.0) - Google API client library enabling Google Calendar integration.
  - Repository: https://github.com/googleapis/google-api-nodejs-client
  - License: Apache 2.0

- **[Pusher](https://pusher.com/)** (v5.3.2) - Real-time communication library enabling live messaging and instant updates between connected clients.
  - Repository: https://github.com/pusher/pusher-http-node
  - License: MIT

### Utilities & Helpers
- **[date-fns](https://date-fns.org/)** (v4.1.0) - Modern JavaScript date utility library for parsing, manipulating, and formatting dates.
  - Repository: https://github.com/date-fns/date-fns
  - License: MIT

- **[Zod](https://zod.dev/)** (v4.3.6) - TypeScript-first schema validation with static type inference used for API request validation.
  - Repository: https://github.com/colinhacks/zod
  - License: MIT

- **[clsx](https://www.npmjs.com/package/clsx)** (v2.1.1) - Utility for constructing conditional CSS class names.
  - Repository: https://github.com/lukeed/clsx
  - License: MIT

- **[Recharts](https://recharts.org/)** (v2.15.4) - Composable charting library for data visualization.
  - Repository: https://github.com/recharts/recharts
  - License: MIT

### Testing & Development
- **[Jest](https://jestjs.io/)** - JavaScript testing framework for unit and integration tests.
  - Repository: https://github.com/facebook/jest
  - License: MIT

- **[React Testing Library](https://testing-library.com/react)** - Testing utilities for React components with focus on user-centric testing.
  - Repository: https://github.com/testing-library/react-testing-library
  - License: MIT

All dependencies are managed via npm and listed in `package.json`. For complete version information and transitive dependencies, refer to `package-lock.json`.
