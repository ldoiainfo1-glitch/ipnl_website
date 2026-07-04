import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import mandateRouter from "./routes/mandates";
import profileRouter from "./routes/profile";
import messagesRouter from "./routes/messages";
import introsRouter from "./routes/intros";
import notificationsRouter from "./routes/notifications";
import leaderboardRouter from "./routes/leaderboard";
import kycRouter from "./routes/kyc";
import adminRouter from "./routes/admin";
import billingRouter from "./routes/billing";
import reputationRouter from "./routes/reputation";
import leadsRouter from "./routes/leads";import contactRouter from './routes/contact';import { initRealtime } from "./lib/realtime";

const app = express();
app.use(cors({
  origin: [
    'https://www.indiapropertynetworks.com',
    'https://indiapropertynetworks.com',
    'http://localhost:5173',
    'http://localhost:4173',
  ],
  credentials: true,
}));
app.use(express.json());
const server = createServer(app);
initRealtime(server);

app.use("/api/auth", authRouter);
app.use("/api/mandates", mandateRouter);
app.use("/api/profile", profileRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/intros", introsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/kyc", kycRouter);
app.use("/api/admin", adminRouter);
app.use("/api/billing", billingRouter);
app.use("/api/reputation", reputationRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/contact", contactRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/", (req, res) => res.json({
  name: "India Property Network Ltd. API",
  version: "1.0.0",
  status: "running",
  docs: "/api/health"
}));

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
server.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`Backend auth service listening on http://0.0.0.0:${port}`);
});


// Prevent transient Supabase network errors (ConnectTimeoutError) from
// crashing the process in Node 22+. Express async middleware errors are
// caught per-request; this guards against any that slip through.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection] Caught - process will NOT exit:', reason);
});