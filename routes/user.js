const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { validEmail, validPassword, ValidType, validCPF } = require('../utils/valid');
const router = express.Router();

const JWT_SECRET = process.env.secret

router.post('/registro', async (req, res) => {
  try {
    const { name, cpf, password, type, empresa } = req.body;

    // 🛑 Validações básicas
    if (!cpf || !password)
      return res.status(400).json({ message: 'CPF e senha são obrigatórios' });

    if (!validCPF(cpf))
      return res.status(400).json({ message: 'CPF inválido' });

    if (!validPassword(password))
      return res.status(400).json({ message: 'Senha fraca (mínimo de 6 caracteres)' });

    if (!ValidType(type))
      return res.status(400).json({ message: 'Cargo do usuário inválido' });

    // ✅ Validação do array de empresas
    if (!Array.isArray(empresa) || empresa.length === 0 || !empresa.every(e => typeof e === 'string' && e.trim() !== '')) {
      return res.status(400).json({ message: 'O campo empresa deve ser um array de strings válido' });
    }

    // ⚠️ Verifica se já existe o mesmo CPF
    const existing = await User.findOne({ cpf });
    if (existing)
      return res.status(409).json({ message: 'CPF já cadastrado' });

    // 💾 Cria o usuário
    const user = new User({
      name,
      cpf,
      password,
      type,
      empresa
    });

    await user.save();

    // 🔑 Cria token JWT
    const payload = { id: user._id, cpf: user.cpf };
    const token = jwt.sign(payload, JWT_SECRET);

    // 📤 Retorna resposta
    res.status(201).json({
      token,
      user: user.name
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
    const { cpf, password } = req.body;
    if (!cpf || !password) return res.status(400).json({ message: 'cpf e senha são obrigatórios' });

    const user = await User.findOne({ cpf });
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Credenciais inválidas' });

    const payload = { id: user._id, cpf: user.cpf };
     if (user.token) {
      return res.status(200).json({ token: user.token, user: user.name });
    }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    user.token = token;
    await user.save();
    res.json({ token, user: { id: user._id, cpf: user.cpf, name: user.name, tipo: user.type} });
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
router.post('/find/:id', async (req, res) => {
  try {
    const { id } = req.params; // pega o id da URL
    const user = await User.findById(id); // busca pelo _id

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    return res.status(200).json({
      cpf: user.cpf,
      name: user.name,
      tipo: user.type,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao procurar usuário' });
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

router.get('/listar', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não providenciado' });
    }

    const token = authHeader.split(' ')[1];

    // busca o usuário pelo token
    const user = await User.findOne({ token: token });
    if (!user) return res.status(401).json({ message: 'Token inválido ou desativado' });

    // busca usuários que NÃO tenham 'adm' no array type
    const usuarios = await User.find(
      { type: { $nin: ['adm'] } }, // <- aqui é o filtro mágico
      { name:1 } // projeção
    );

    return res.json({ user: usuarios });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, cpf, password, type, empresa } = req.body;

    // Busca o usuário
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    // Validações
    if (email && !validCPF(cpf)) return res.status(400).json({ message: 'cpf inválido' });
    if (password && !validPassword(password)) return res.status(400).json({ message: 'Senha fraca (mín 6 caracteres)' });
    if (type && !ValidType(type)) return res.status(400).json({ message: 'Cargo do usuário inválido' });
    if (empresa && (!Array.isArray(empresa) || empresa.length === 0 || !empresa.every(e => typeof e === 'string' && e.trim() !== ''))) {
      return res.status(400).json({ message: 'O campo empresa deve ser um array de strings válido' });
    }

    // Evita duplicação de email
    if (email && email !== user.cpf) {
      const existing = await User.findOne({ cpf });
      if (existing) return res.status(409).json({ message: 'Email já cadastrado por outro usuário' });
    }

    // Atualiza os campos
    if (name) user.name = name;
    if (cpf) user.cpf = cpf;
    if (type) user.type = type;
    if (empresa) user.empresa = empresa;
    if (password) user.password = password; // pre-save vai hash

    await user.save();

    return res.status(200).json({
      message: 'Usuário atualizado com sucesso',
      user: {
        id: user._id,
        name: user.name,
        cpf: user.cpf,
        type: user.type,
        empresa: user.empresa,
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao atualizar usuário' });
  }
});

module.exports = router;
