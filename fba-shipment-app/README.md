# FBA Shipment Management App

A comprehensive web application for managing Amazon FBA (Fulfillment by Amazon) shipments, designed to streamline warehouse operations, picker workflows, and shipment tracking.

## 🌟 Features

### Core Functionality
- **Shipment Management**: Create, track, and manage FBA shipments with full lifecycle support
- **Item Tracking**: Comprehensive SKU management with quantities and fulfillment data
- **Box Management**: Organize items into boxes with real-time progress tracking
- **Picker Interface**: Mobile-optimized warehouse picking interface with UUID-based access
- **User Management**: Role-based access control (Admin, Shipper, Packer)
- **Audit Logging**: Complete audit trail for all system actions
- **Notifications**: Real-time in-app and email notifications system
- **Report Generation**: CSV report generation in multiple formats (FBA, Inventory, Custom)

### User Roles & Permissions
- **Admin**: Full system access, user management, reports, and system configuration
- **Shipper**: Create and manage shipments, generate picker links, view reports
- **Packer**: Access shipments via picker links, pick and pack items

### Advanced Features
- **Real-time Updates**: Live progress tracking and status updates
- **Mobile Responsive**: Optimized for warehouse scanners and mobile devices
- **CSV Import/Export**: Bulk shipment data import and comprehensive reporting
- **Picker Links**: Secure, time-limited access for warehouse personnel
- **Notification System**: Configurable alerts with batch processing

## 🛠 Technology Stack

### Frontend
- **Next.js 16.1.6**: React framework with App Router
- **React 19.2.3**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible UI components
- **Lucide React**: Modern icon library
- **React Hook Form**: Form handling with validation
- **React Dropzone**: File upload component

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **Prisma ORM**: Database ORM with type safety
- **NextAuth.js**: Authentication and session management
- **bcryptjs**: Password hashing
- **UUID**: Unique identifier generation
- **CSV Parser**: CSV data processing
- **Multer**: File upload handling

### Database
- **SQLite**: Local development database (easily replaceable with PostgreSQL/MySQL for production)

### Development Tools
- **ESLint**: Code linting and formatting
- **PostCSS**: CSS processing
- **TypeScript Compiler**: Type checking and compilation

## 📋 Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- Git for version control

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd fba-shipment-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Optional: Email Configuration for Notifications
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

### 4. Database Setup
```bash
# Generate Prisma Client
npx prisma generate

# Run Database Migrations
npx prisma migrate dev

# (Optional) Seed Database with Initial Data
# npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | Yes |
| `NEXTAUTH_URL` | Base URL for NextAuth.js | Yes |
| `NEXTAUTH_SECRET` | Secret key for session encryption | Yes |
| `EMAIL_HOST` | SMTP server hostname | No |
| `EMAIL_PORT` | SMTP server port | No |
| `EMAIL_USER` | SMTP username | No |
| `EMAIL_PASS` | SMTP password | No |

### Database Configuration

The application uses SQLite by default for development. For production, update your `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql" // or "mysql"
  url      = env("DATABASE_URL")
}
```

Then run:
```bash
npx prisma migrate dev --name "switch-to-postgresql"
```

## 📁 Project Structure

```
fba-shipment-app/
├── prisma/                     # Database schema and migrations
│   ├── schema.prisma          # Database schema definition
│   └── migrations/            # Database migration files
├── public/                     # Static assets
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── boxes/        # Box management
│   │   │   ├── logs/         # Audit logs
│   │   │   ├── notifications/ # Notification system
│   │   │   ├── picker-links/ # Picker link management
│   │   │   ├── reports/      # Report generation
│   │   │   ├── shipments/    # Shipment management
│   │   │   └── users/        # User management
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # Main dashboard
│   │   └── picker/           # Picker interface
│   ├── components/           # Reusable React components
│   │   └── ui/              # UI component library
│   └── lib/                 # Utility libraries
│       ├── audit.ts         # Audit logging
│       ├── auth.ts          # Authentication configuration
│       ├── notifications.ts # Notification system
│       ├── prisma.ts        # Prisma client
│       ├── reports.ts        # Report generation
│       ├── users.ts         # User utilities
│       └── utils.ts         # General utilities
├── .env.local               # Environment variables (gitignored)
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## 🔐 Authentication & Authorization

### User Roles

1. **Admin**: Full system access
   - User management (create, edit, delete users)
   - System configuration
   - All shipment operations
   - Access to all reports and audit logs

2. **Shipper**: Shipment management
   - Create and manage shipments
   - Generate picker links
   - View reports for their shipments
   - Upload CSV data

3. **Packer**: Warehouse operations
   - Access shipments via picker links (no login required)
   - Pick and pack items
   - Add comments to items
   - Conclude boxes

### Authentication Flow
- Email/password authentication with NextAuth.js
- Session-based authentication with secure cookies
- Role-based access control on all API endpoints
- Picker interface uses UUID-based access for warehouse efficiency

## 📊 API Documentation Overview

### Core Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/check-admin` - Admin verification

#### Users (Admin only)
- `GET /api/users` - List users with pagination
- `POST /api/users/create` - Create new user
- `GET /api/users/[userId]` - Get user details
- `PUT /api/users/[userId]` - Update user (role/password)
- `DELETE /api/users/[userId]` - Delete user
- `GET /api/users/statistics` - User statistics

#### Shipments
- `POST /api/shipments/import` - Import shipments from CSV
- Additional shipment endpoints (refer to API docs)

#### Boxes
- `GET /api/boxes/[boxId]` - Get box details
- `POST /api/boxes/[boxId]/items` - Add items to box
- `POST /api/boxes/[boxId]/items/[itemId]/comment` - Add item comment
- `POST /api/boxes/[boxId]/conclude` - Conclude box

#### Picker Links
- `GET /api/picker-links` - List picker links
- `POST /api/picker-links` - Create/delete picker links
- `GET /api/picker-links/[uuid]` - Access shipment (no auth)
- `POST /api/picker-links/[uuid]` - Update picker link

#### Reports
- `GET /api/reports` - Generate reports
- `GET /api/reports/search` - Search reports
- `GET /api/reports/[filename]` - Download report file

#### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/[notificationId]` - Mark as read
- `GET /api/notifications/unread-count` - Get unread count
- `POST /api/notifications/cleanup` - Cleanup expired notifications

#### Audit Logs
- `GET /api/logs` - Get audit logs
- `GET /api/logs/[filename]` - Export logs to file

For detailed API documentation, see `API_DOCUMENTATION.md`

## 📈 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use Tailwind CSS for styling
- Component-based architecture
- Functional React with hooks

### Database Best Practices
- Always use Prisma migrations for schema changes
- Include proper database indexes for performance
- Use transactions for multi-record operations
- Implement proper error handling

### API Development
- Use Next.js API Routes
- Implement proper error handling and validation
- Include audit logging for all operations
- Use role-based access control
- Return consistent JSON responses

### Testing
- Test API endpoints thoroughly
- Verify role-based access control
- Test database operations
- Test file upload/download functionality
- Test responsive design on various devices

### Git Workflow
- Use feature branches for new development
- Write descriptive commit messages
- Include proper documentation for new features
- Test changes before merging

## 🚀 Production Deployment

### Environment Preparation
1. **Environment Variables**: Set all required environment variables
2. **Database**: Configure production database (PostgreSQL recommended)
3. **Domain**: Configure your domain and SSL
4. **Email**: Set up email service for notifications

### Deployment Options

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

#### Traditional Server
```bash
# Build application
npm run build

# Start production server
npm start
```

### Production Considerations

#### Database
- Use PostgreSQL or MySQL for production
- Configure connection pooling
- Set up regular backups
- Monitor database performance

#### Security
- Use strong NEXTAUTH_SECRET
- Enable HTTPS
- Configure appropriate CORS headers
- Implement rate limiting
- Monitor for security vulnerabilities

#### Performance
- Enable Next.js production optimizations
- Configure CDN for static assets
- Monitor application performance
- Implement caching strategies
- Use appropriate server sizing

#### Monitoring
- Set up application monitoring
- Configure error tracking
- Monitor database performance
- Set up alerts for critical issues
- Regular log review

#### Backups
- Regular database backups
- Code repository backups
- File system backups for reports
- Disaster recovery plan

## 🔍 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Reset database
npx prisma migrate reset

# Regenerate client
npx prisma generate
```

#### Authentication Issues
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL is correct
- Clear browser cookies

#### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules
rm -rf node_modules package-lock.json
npm install
```

### Performance Issues
- Check database queries with Prisma Studio
- Monitor API response times
- Review database indexes
- Check memory usage

## 📚 Additional Documentation

- `API_DOCUMENTATION.md` - Detailed API endpoint documentation
- `USER_MANAGEMENT_DOCUMENTATION.md` - User management features
- `REPORTS_DOCUMENTATION.md` - Report generation utilities
- `PICKER_USAGE.md` - Picker interface usage guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Review the documentation files
- Check the troubleshooting section

---

Built with ❤️ for efficient FBA shipment management