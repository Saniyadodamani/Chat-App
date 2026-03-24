import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        // Disable buffering globally to avoid the 10s timeout notifications
        mongoose.set('bufferCommands', false);

        mongoose.connection.on('connected', () => console.log('✅ MongoDB Connected'));
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB Connection Error:', err.message);
        });
        mongoose.connection.on('disconnected', () => console.warn('⚠️ MongoDB Disconnected'));

        const conn = await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`, {
            serverSelectionTimeoutMS: 5000,
        });
        
        console.log(`MongoDB Host: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error connecting to database: ${error.message}`);
        if (error.message.includes('authentication failed')) {
            console.error('👉 TIP: Please check your MONGODB_URI credentials in .env');
        }
    }
}