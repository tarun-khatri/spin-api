import dotenv from 'dotenv';
import Database from '../config/database';
import { User } from '../models/User';
import { VaultLogger } from '../utils/VaultLogger';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/constants';

dotenv.config();

interface AdminUserData {
  userId: string;
  email: string;
  username: string;
  password: string;
}

class AdminUserCreator {
  private async createAdminUser(userData: AdminUserData): Promise<void> {
    try {
      await Database.connect();

      // Check if admin user already exists
      const existingUser = await User.findOne({ 
        $or: [
          { userId: userData.userId },
          { email: userData.email },
          { username: userData.username }
        ]
      });

      if (existingUser) {
        VaultLogger.warn('Admin user already exists', {
          existingUserId: existingUser.userId,
          existingEmail: existingUser.email
        });
        return;
      }

      // Create admin user
      const adminUser = new User({
        userId: userData.userId,
        email: userData.email,
        username: userData.username,
        role: 'ADMIN',
        spins: 0
      });

      await adminUser.save();

      // Generate JWT token for the admin user
      const token = jwt.sign(
        { 
          userId: adminUser.userId, 
          role: adminUser.role 
        },
        JWT_CONFIG.secret,
        { expiresIn: JWT_CONFIG.expiresIn } as jwt.SignOptions
      );

      VaultLogger.info('Admin user created successfully', {
        userId: adminUser.userId,
        email: adminUser.email,
        role: adminUser.role
      });

      console.log('\n=== ADMIN USER CREATED ===');
      console.log(`User ID: ${adminUser.userId}`);
      console.log(`Email: ${adminUser.email}`);
      console.log(`Username: ${adminUser.username}`);
      console.log(`Role: ${adminUser.role}`);
      console.log(`JWT Token: ${token}`);
      console.log('==========================\n');

      await Database.disconnect();

    } catch (error) {
      VaultLogger.error('Failed to create admin user', error);
      throw error;
    }
  }

  public async run(): Promise<void> {
    const adminData: AdminUserData = {
      userId: 'admin_001',
      email: 'admin@freespin.com',
      username: 'admin',
      password: 'Admin@123!' // In production, this should be more secure
    };

    await this.createAdminUser(adminData);
  }
}

// Run the script
if (require.main === module) {
  const creator = new AdminUserCreator();
  creator.run().catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export default AdminUserCreator;