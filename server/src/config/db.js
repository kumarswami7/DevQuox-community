import mongoose from "mongoose";
import dns from "dns";


// Use Google Public DNS to resolve MongoDB SRV records if local DNS blocks SRV queries
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {
  // Ignore in environments where setting DNS servers is restricted
}


export const getDatabaseStatus = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateCode = mongoose.connection.readyState;
  return {
    status: stateCode === 1 ? 'connected' : 'disconnected',
    state: states[stateCode] || 'unknown',
  };
};

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/devconnect";
    const conn = await mongoose.connect(mongoUri, {
      family: 4,
    });

    console.log("✅ MongoDB Connected Successfully");
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.warn("⚠️ MongoDB Connection Notice:", error.message);
    console.log("ℹ️ Server running in resilient mode.");
  }
};

export default connectDB;