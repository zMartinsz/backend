const express = require('express');
const multer = require('multer');
const Arquivo = require('../models/arquivos');
const router = express.Router();
const auth = require('../middleware/auth')
// Multer storage em memória
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

// Rota POST: envia ID via JSON + arquivo
router.post('/upload', auth, upload.single('arquivo'), async (req, res) => {
  try {
    // pega o ID enviado pelo form-data
    const { id } = req.body; 
    if (!id) return res.status(400).json({ message: 'ID é obrigatório' });

    const { originalname, mimetype, buffer } = req.file;

    const arquivo = new Arquivo({
      _id: id,           // ID passado pelo cliente
      nome: originalname,
      tipo: mimetype,
      arquivo: buffer
    });

    await arquivo.save();
    res.status(201).json({ message: 'Arquivo salvo com sucesso', id: arquivo._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const arquivo = await Arquivo.findById(req.params.id);
  if (!arquivo) return res.status(404).json({ message: 'Arquivo não encontrado' });

  res.set({
    'Content-Type': arquivo.tipo,
    'Content-Disposition': `attachment; filename="${arquivo.nome}"`
  });
  res.send(arquivo.arquivo);
});
module.exports = router;
