import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/authRoutes.js"
import chatRoutes from "./routes/chatRoutes.js"
import todoRoutes from './routes/todoRoutes.js';
import subscriptionRoutes from './routes/subscription.js';
import googleRoutes from './routes/google.js';
import { app, server } from "./lib/socket.js";

dotenv.config();


const PORT =process.env.PORT;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173', // Vite frontend
  credentials: true,               // if you're using cookies or auth headers
}));

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/google', googleRoutes);

server.listen(PORT, () => {
  console.log("server is running on port:" +PORT);
  connectDB();
})

