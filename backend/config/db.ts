import mongoose from 'mongoose';

export interface DatabaseStatus {
  connected: boolean;
  type: 'mongodb' | 'embedded';
  host?: string;
  database?: string;
  message: string;
}

export let dbStatus: DatabaseStatus = {
  connected: false,
  type: 'embedded',
  message: 'Initializing database connection...',
};

export const connectDB = async (): Promise<DatabaseStatus> => {
  const mongoURI = process.env.MONGO_URI;

  if (mongoURI && mongoURI.startsWith('mongodb')) {
    try {
      console.log('Attempting MongoDB Atlas connection...');
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 5000,
      });

      dbStatus = {
        connected: true,
        type: 'mongodb',
        host: mongoose.connection.host,
        database: mongoose.connection.name,
        message: `Successfully connected to MongoDB Atlas (${mongoose.connection.host})`,
      };
      console.log(`[MongoDB] Connected: ${dbStatus.host}/${dbStatus.database}`);
      return dbStatus;
    } catch (error: any) {
      console.warn(`[MongoDB] Connection failed: ${error.message}. Switching to local resilient database engine.`);
      dbStatus = {
        connected: false,
        type: 'embedded',
        message: `MongoDB Atlas URI provided but connection failed (${error.message}). Running with local resilient data engine.`,
      };
      return dbStatus;
    }
  } else {
    dbStatus = {
      connected: true,
      type: 'embedded',
      message: 'Running with local persistent store. (Set MONGO_URI in .env to connect to MongoDB Atlas)',
    };
    console.log('[Database] Operating with local resilient database engine.');
    return dbStatus;
  }
};
