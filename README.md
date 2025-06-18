# Free Spin Granting API

A secure API for granting free spins to users with duplicate prevention, transaction logging, and admin-only access.

## 🚀 Features

- Secure spin granting with duplicate prevention
- Transaction logging with IP tracking
- Admin-only access with JWT authentication
- Rate limiting protection
- MongoDB integration
- Comprehensive test coverage

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Spin-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/free-spin-db
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=24h
```

4. Build the project:
```bash
npm run build
```

5. Create Admin User:
```bash
npx ts-node src/scripts/createAdminUser.ts
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## 🧪 Running Tests

```bash
npm test
```

## 📚 API Documentation

### Grant Free Spins
```http
POST /api/v1/grant-spin
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
    "userId": "123456",
    "source": "VAULT_REWARD", // or "ADMIN_PANEL", "DAILY_BONUS"
    "spinCount": 5
}
```

#### Response
```json
{
    "success": true,
    "data": {
        "userId": "123456",
        "source": "VAULT_REWARD",
        "spinCount": 5,
        "grantId": "unique-grant-id"
    }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
    "success": false,
    "error": "Authentication failed: No token provided"
}
```

#### 409 Conflict (Duplicate Spins)
```json
{
    "success": false,
    "error": "Duplicate spin grant detected for today"
}
```

#### 429 Too Many Requests
```json
{
    "success": false,
    "error": "Rate limit exceeded"
}
```

## 🔒 Security Features

1. **JWT Authentication**
   - Admin-only access
   - Token expiration
   - Secure token validation

2. **Rate Limiting**
   - 5 requests per minute per IP
   - Configurable limits

3. **Input Validation**
   - Request body validation
   - Source enum validation
   - Spin count validation

4. **Duplicate Prevention**
   - Same user + source per day check
   - MongoDB compound index

## 📝 Transaction Logging

Each spin grant is logged with:
- userId
- spinCount
- source
- IP address
- timestamp
- status (SUCCESS/FAILED)

## 🧪 Testing

The project includes comprehensive tests covering:
- Authentication
- Input validation
- Duplicate prevention
- Rate limiting
- Transaction logging
- Different source handling

Run tests with:
```bash
npm test
```

## 📦 Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── types/          # TypeScript types
├── utils/          # Utility functions
└── tests/          # Test files
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| MONGODB_URI | MongoDB connection string | - |
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |
| JWT_SECRET | JWT signing key | - |
| JWT_EXPIRE | JWT expiration | 24h |


## 📄 License

This project is licensed under the MIT License. 