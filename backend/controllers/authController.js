const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.register = async (req, res) => {
  try {
    const { nickname, email, password } = req.body;

    if (!nickname || !email || !password)
      return res.status(400).json({ message: "Nickname, email & password required" });
    if (nickname.length < 2 || nickname.length > 20)
      return res.status(400).json({ message: "Nickname must be 2-20 characters" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be 6+ chars" });

    const existsEmail = await User.findOne({ email });
    if (existsEmail) return res.status(400).json({ message: "Email already in use" });

    const existsNick = await User.findOne({ nickname: { $regex: new RegExp(`^${nickname}$`, "i") } });
    if (existsNick) return res.status(400).json({ message: "Nickname already taken" });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ nickname, email, password: hashed });

    res.json({ message: "Registered ✅" });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email & password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};