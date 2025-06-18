import mongoose from 'mongoose';
import { MONGODB_CONFIG } from './constants';
import { VaultLogger } from '../utils/VaultLogger';

class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      VaultLogger.info('Database already connected');
      return;
    }

    try {      
      await mongoose.connect(MONGODB_CONFIG.uri, MONGODB_CONFIG.options);
      this.isConnected = true;
      VaultLogger.info('Successfully connected to MongoDB');

      mongoose.connection.on('error', (error) => {
        VaultLogger.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        VaultLogger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

    } catch (error) {
      VaultLogger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      VaultLogger.info('Disconnected from MongoDB');
    } catch (error) {
      VaultLogger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public isConnectedToDatabase(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

export default Database.getInstance();