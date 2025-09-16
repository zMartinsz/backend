const express = require('express');
const multer = require('multer');
const Arquivo = require('../models/arquivos');
const router = express.Router();
const auth = require('../middleware/auth')
const { validEmail, validPassword, ValidType } = require('../utils/valid');
const User = require('../models/user');
//#region Multer storage em memória
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // até 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Apenas arquivos PDF são permitidos'));
    }
    cb(null, true);
  }
});
//#endregion
//#region Enviar
router.post('/upload', upload.single('arquivo'), async (req, res) => {
  try {
    const { id, motorista } = req.body; 
    if (!id) return res.status(400).json({ message: 'ID é obrigatório' });
    if (!motorista) return res.status(400).json({ message: 'Cargo errado' });

    const { originalname, mimetype, buffer } = req.file;

    // Cria o documento já com o cargo no array
    const arquivo = new Arquivo({
      _id: id,            // ID passado pelo cliente
      nome: originalname,
      tipo: mimetype,
      arquivo: buffer,
      cargo: [motorista, "adm"]   // array já iniciado com o cargo
    });

    await arquivo.save(); // salva no banco
    res.status(201).json({ message: 'Arquivo salvo com sucesso', id: arquivo._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//#endregion

//#region download
router.get('/download', auth, async (req, res) => {
  try{const arquivo = await Arquivo.findById(req.body.id);
  if (!arquivo) return res.status(404).json({ message: 'Arquivo não encontrado' });

  res.set({
    'Content-Type': arquivo.tipo,
    'Content-Disposition': `attachment; filename="${arquivo.nome}"`
  });
  res.send(arquivo.arquivo);
}catch (err){
  res.status(500).json({error: err.message})
}});

//#endregion

//#region delete
router.post('/delete', async (req,res) => {
  try{
    const {id} = req.body
    await Arquivo.findByIdAndDelete(id);
    return res.status(400).json({arquivo: "deletado"})
  }catch (err){
  res.status(500).json({error: err.message})
  }});
//#endregion

//#region listar
router.get('/listar', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não providenciado' });
  }
  const token = authHeader.split(' ')[1]

  // busca o usuário pelo id e token
    const user = await User.findOne({token: token });
    if (!user) return res.status(401).json({ message: 'Token inválido ou desativado' });
    const arquivos = await Arquivo.find({ cargo: user.type });
    return res.json(arquivos)
})
//#endregion
module.exports = router;
