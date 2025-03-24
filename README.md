# Tour Operator Express API

A modern tour operator management system built with Express.js, TypeScript, and MongoDB. This API provides comprehensive tools for managing tour packages, destinations, and bookings.

## 🌟 Features

- **Tour Package Management**: Create, update, and manage tour packages with detailed information
- **Tourist Destination Management**: Add, edit, and organize tourist destinations with image uploads
- **Tour Type Categorization**: Classify tours by type for better organization
- **Booking Management**: Handle bookings with date range support
- **Cancellation Policies**: Define and apply various cancellation policies
- **User Authentication**: Secure login and token-based authorization
- **Role-based Access Control**: Manage user permissions with role assignments

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **File Uploads**: Multer
- **API Documentation**: Swagger (commented out but configured)
- **Logging**: Morgan
- **Testing**: Jest, Supertest

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## 🚀 Installation and Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tourOperatorExpress.git
   cd tourOperatorExpress
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/tourism
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=1d
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the server**
   - For development:
   ```bash
   npm run dev
   ```
   - For production:
   ```bash
   npm start
   ```

## 📊 API Structure

The API follows a modular architecture pattern with the following structure:

- **Modules**: Feature-specific components (auth, tourPackage, tourType, etc.)
  - **Controller**: Handles HTTP requests and responses
  - **Service**: Contains business logic
  - **Repository**: Data access layer for database operations
  - **Model**: Database schema definitions
  - **DTO**: Data Transfer Objects for validation
  - **Router**: Define API routes

## 🔐 Authentication

The API uses JWT for authentication. To use protected routes:

1. Get a token by logging in via `POST /api/v1/auth/login`
2. Include the token in the Authorization header: `Bearer <your_token>`

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/login`: User login

### User Management
- `GET /api/v1/users`: Get all users
- `POST /api/v1/users`: Create a new user
- `PUT /api/v1/users/:id`: Update user
- `DELETE /api/v1/users/:id`: Delete user

### Tour Types
- `GET /api/v1/tour-types`: Get all tour types
- `POST /api/v1/tour-types`: Create a new tour type
- `PUT /api/v1/tour-types/:id`: Update tour type
- `DELETE /api/v1/tour-types/:id`: Delete tour type

### Tourist Destinations
- `GET /api/v1/tourist-destination`: Get all tourist destinations
- `POST /api/v1/tourist-destination`: Create a new tourist destination (with image upload)
- `PUT /api/v1/tourist-destination/:id`: Update tourist destination
- `DELETE /api/v1/tourist-destination/:id`: Delete tourist destination

### Tour Packages
- `GET /api/v1/tour-package`: Get all tour packages
- `POST /api/v1/tour-package`: Create a new tour package
- `PUT /api/v1/tour-Package/:id`: Update tour package
- `DELETE /api/v1/tour-package/:id`: Delete tour package

Additional endpoints exist for cancellation policies, date ranges, roles, and security settings.

## 🧪 Testing

Run the test suite with:

```bash
npm test
```

The project includes unit and integration tests for:
- Authentication services
- API endpoints
- Business logic

## 🔄 Development Workflow

1. **Running in development mode**:
   ```bash
   npm run dev
   ```
   This uses ts-node-dev to automatically restart on file changes.

2. **Building for production**:
   ```bash
   npm run build
   ```
   This compiles TypeScript files to JavaScript in the `dist` directory.

## 📝 Code Style and Standards

- The project follows TypeScript best practices
- Uses a modular architecture for better organization
- Implements error handling middleware for consistent error responses
- Data validation with Zod ensures API input integrity

## 👍 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

[License information here]

## 📞 Contact

[Your contact information]

