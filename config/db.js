import mongoose from "mongoose";
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.db_url, {
      dbName: "user", // nome do database
    });
    console.log("🔥 Conectado ao MongoDB Atlas!");
  } catch (err) {
    console.error("❌ Erro ao conectar:", err.message);
    process.exit(1);
  }
};

export default connectDB;
