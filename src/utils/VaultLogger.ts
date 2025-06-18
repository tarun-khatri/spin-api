import winston from 'winston';
import path from 'path';

class VaultLoggerClass {
  private logger: winston.Logger;

  constructor() {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const logFile = process.env.LOG_FILE || 'logs/app.log';

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'free-spin-api' },
      transports: [
        new winston.transports.File({ 
          filename: path.join(process.cwd(), 'logs', 'error.log'), 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: path.join(process.cwd(), logFile) 
        })
      ],
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }
  }

  public info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  public error(message: string, error?: any): void {
    this.logger.error(message, { error: error?.stack || error });
  }

  public warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  public debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  public logSpinTransaction(data: {
    userId: string;
    spinCount: number;
    source: string;
    ipAddress: string;
    timestamp: Date;
    status: 'SUCCESS' | 'FAILED';
    errorMessage?: string;
  }): void {
    this.info('Spin transaction logged', {
      type: 'SPIN_TRANSACTION',
      ...data
    });
  }
}
export const VaultLogger = new VaultLoggerClass();
