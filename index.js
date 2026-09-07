const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");

async function startMayuMD() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ MAYU-MD CONNECTED");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("❌ Connection closed");

      if (shouldReconnect) {
        startMayuMD();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const command = text.trim().toLowerCase();

    if (command === ".ping") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "🏓 Pong!\n\n🤖 MAYU-MD is online."
      });
    }

    if (command === ".menu") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
`╭───〔 🤖 MAYU-MD 〕───╮

┃ .ping
┃ .menu
┃ .owner

╰────────────────────╯`
      });
    }

    if (command === ".owner") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "👤 MAYU-MD Owner"
      });
    }
  });
}

startMayuMD();
