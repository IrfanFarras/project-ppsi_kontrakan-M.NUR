import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`✅ Backend server running on http://localhost:${env.PORT}`);
  // eslint-disable-next-line no-console
  console.log(`   Health check: http://localhost:${env.PORT}/api/health`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    // eslint-disable-next-line no-console
    console.error(
      `❌ Port ${env.PORT} sudah dipakai. Hentikan proses lain yang memakai port ini lalu coba lagi.\n` +
        `   Windows: netstat -ano | findstr :${env.PORT}  →  taskkill /PID <pid> /F`
    );
    process.exit(1);
  }
  throw err;
});

function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} diterima, menutup server dengan bersih...`);
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log("✅ Server ditutup, port dilepas.");
    process.exit(0);
  });

  // Failsafe: paksa keluar kalau close() macet lebih dari 5 detik.
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
