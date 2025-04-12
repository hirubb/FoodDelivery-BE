const express = require("express");
const cors = require("cors");
const { sendEmail } = require("./email");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/notify", async (req, res) => {
  const { to, subject, text } = req.body;

  try {
    await sendEmail({ to, subject, text });
    res.status(200).json({ message: "Notification sent" });
  } catch (err) {
    console.error("Notification Error:", err.message);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Notification Service running on port ${PORT}`));
