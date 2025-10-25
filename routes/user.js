const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { validEmail, validPassword, ValidType, ValidEmpresa } = require('../utils/valid');
const router = express.Router();

const JWT_SECRET = process.env.secret

//#region Registro
router.post('/registro', async (req, res) => {
  try {
    const { name, email, password, type, empresa } = req.body;

    // 🛑 Validações básicas
    if (!email || !password) 
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });

    if (!validEmail(email)) 
      return res.status(400).json({ message: 'Email inválido' });

    if (!validPassword(password)) 
      return res.status(400).json({ message: 'Senha fraca (mín 6 caracteres)' });

    if (!ValidType(type)) 
      return res.status(400).json({ message: 'Cargo do usuário inválido' });

    // ✅ Validação do array de empresas
    if (!Array.isArray(empresa) || empresa.length === 0 || !empresa.every(e => typeof e === 'string' && e.trim() !== '')) {
      return res.status(400).json({ message: 'O campo empresa deve ser um array de strings válido' });
    }

    // ⚠️ Verifica se o email já existe
    const existing = await User.findOne({ email });
    if (existing) 
      return res.status(409).json({ message: 'Email já cadastrado' });

    // 💾 Cria o usuário
    const user = new User({ name, email, password, type, empresa });
    await user.save();

    // 🔑 Cria token JWT
    const payload = { id: user._id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET);

    // 📤 Retorna resposta
    res.status(201).json({ 
      token, 
      user: { id: user._id, email: user.email, name: user.name, type: user.type, empresa: user.empresa } 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

//#endregion

//#region login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email e senha são obrigatórios' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Credenciais inválidas' });

    const payload = { id: user._id, email: user.email };
     if (user.token) {
      return res.status(200).json({ token: user.token });
    }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    user.token = token;
    await user.save();
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, tipo: user.type} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});
//#endregion


//#endregion
//#region logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não providenciado' });
    }

    const token = authHeader.split(' ')[1];

    // Encontra usuário com esse token e remove
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: 'Token não encontrado' });

    user.token = null; // invalida o token
    await user.save();

    res.status(200).json({ message: 'Logout realizado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//#endregion
//#region Deletar
router.post('/delete_account', async (req, res) => {
 try {
  const { name } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não providenciado' });
  }

  if (!name) {
    return res.status(400).json({ message: 'Nome do usuário é obrigatório' });
  }

  const token = authHeader.split(' ')[1];
  const user = await User.findOne({ token });

  if (!user) {
    return res.status(404).json({ message: 'Usuário com esse token não encontrado' });
  }

  const isAdm = Array.isArray(user.type) && user.type.includes("adm");

  if (!isAdm) {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem deletar usuários.' });
  }

  const deleted = await User.deleteOne({ name });

  if (deleted.deletedCount === 0) {
    return res.status(404).json({ message: 'Usuário não encontrado para exclusão.' });
  }

  return res.status(200).json({ message: `Usuário '${name}' deletado com sucesso.` });

} catch (err) {
  console.error(err);
  return res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
}
});
//#endregion
//#region buscar
router.post('/find', async (req, res) => {
  try{
    const {email} = req.body;
    const user = await User.findOne({email})
    return res.status(200).json({user: user.name, email: user.email, name: user.name, tipo: user.type})
  }catch (err){
    console.error(err);
    res.status(500).json({message: 'erro ao procurar usuario'})
  }
});
//#endregion

//#region buscar_cargo
router.post('/fc', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não providenciado' });
    }

    const token = authHeader.split(' ')[1];
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: 'Token não encontrado' });
    }

    // 👇 verifica se existe "adm" no array user.type
    const isAdm = Array.isArray(user.type) && user.type.includes("adm");
    const empresa = user.empresa;
    return res.status(200).json({ isAdm, empresa});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao procurar cargo' });
  }
});

//#endregion

router.get('/ping', async (req, res) => {
res.status(200).json({message: 'pingado'})
});
module.exports = router;