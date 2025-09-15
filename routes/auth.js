const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { validEmail, validPassword } = require('../utils/valid');
const router = express.Router();

const JWT_SECRET = process.env.secret

router.post('/registro', async (req, res) => {
    try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    if (!validEmail(email)) return res.status(400).json({ message: 'Email inválido' });
    if (!validPassword(password)) return res.status(400).json({ message: 'Senha fraca (mín 6 caracteres)' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email já cadastrado' });

    const user = new User({ name, email, password });
    await user.save();

    const payload = { id: user._id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET);

    res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;