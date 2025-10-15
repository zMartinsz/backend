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
async function obterUuidIncrementado() {
  try {
    // Busca todos os documentos com o campo 'uuid'
    const arquivos = await Arquivo.find({}).select('uuid');

    if (arquivos.length === 0) {
      // Se não houver arquivos, o primeiro UUID será "1"
      return 1;
    }

    // Encontrar o maior valor de uuid
    let maiorUuid = arquivos.reduce((max, arquivo) => {
      // Tenta converter para número
      const numeroUuid = parseInt(arquivo.uuid, 10);

      // Verifica se o valor é um número válido
      if (isNaN(numeroUuid)) {
        // Caso o UUID não seja numérico, ignoramos esse arquivo
        console.warn(`UUID inválido encontrado: ${arquivo.uuid}`);
        return max;  // Retorna o valor máximo atual
      }

      // Compara e retorna o maior valor
      return Math.max(max, numeroUuid);
    }, 0);

    // Incrementar em 1 o maior valor encontrado
    console.log(maiorUuid + 1);
    return maiorUuid + 1;
  } catch (error) {
    console.error("Erro ao obter UUID incrementado:", error);
    throw error;
  }
}
router.post('/upload', upload.single('arquivo'), async (req, res) => {
  try {
    const { id, motorista } = req.body; 
    if (!id) return res.status(400).json({ message: 'ID é obrigatório' });
    if (!motorista) return res.status(400).json({ message: 'Cargo errado' });
    if (!ValidType(motorista)) return res.status(400).json({ message: "cargo erradoo"});

    if (!req.file) return res.status(400).json({ message: 'Arquivo é obrigatório' });

    const { originalname, mimetype, buffer } = req.file;

    const novoUuid = await obterUuidIncrementado();
    console.log(novoUuid);
    console.log(id)
    // Detecta PDF por MIME ou extensão
    const isPdf =
      mimetype === 'application/pdf' ||
      path.extname(originalname || '').toLowerCase() === '.pdf';

    // Se for PDF, renomeia para <uuid>.pdf
    const nomeFinal = isPdf ? `${novoUuid}.pdf` : (originalname || `${novoUuid}`);

    // (opcional) normalize o tipo se for pdf
    const tipoFinal = isPdf ? 'application/pdf' : mimetype;

    const arquivo = new Arquivo({
      _id: id,                    // ID passado pelo cliente
      uuid: String(novoUuid),     // garante string
      nome: nomeFinal,            // <- aqui está o "rename" lógico
      tipo: tipoFinal,
      arquivo: buffer,
      cargo: [motorista, "adm"]
    });

    await arquivo.save();

    res.status(201).json({
      message: 'Arquivo salvo com sucesso',
      id: arquivo._id,
      uuid: arquivo.uuid,
      nome: arquivo.nome
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//#endregion

//#region download

router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar arquivo pelo id
    const arquivo = await Arquivo.findById(id);
    if (!arquivo) {
      return res.status(404).json({ message: 'Arquivo não encontrado' });
    }

    // Define o nome final do arquivo, removendo aspas e caracteres problemáticos
    const uuidStr = String(arquivo.uuid);
    const nomeFinal = `${uuidStr}.pdf`.replace(/["\s\[\]#&;]/g, '_'); // Substitui aspas, espaços e caracteres problemáticos

    const buf = arquivo.arquivo; // Buffer do Mongo
    if (!buf || !buf.length) {
      return res.status(404).json({ message: 'Conteúdo vazio' });
    }

    // Define os cabeçalhos de download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', buf.length);
    res.setHeader('Content-Disposition', `attachment; filename="${nomeFinal}"`);

    // Envia o arquivo
    return res.status(200).end(buf);
  } catch (err) {
    console.error('Erro no download do arquivo:', err.message); // Melhor log de erro
    return res.status(500).json({ error: err.message });
  }
});
//#endregion

//#region delete
router.delete('/delete', async (req,res) => {
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

  const token = authHeader.split(' ')[1];

  // busca o usuário pelo id e token
  const user = await User.findOne({ token: token });
  if (!user) return res.status(401).json({ message: 'Token inválido ou desativado' });
  // retorna só o _id
  const arquivos = await Arquivo.find(
    { cargo: { $in: user.type } },
    { _id: 1,  uuid: 1 }
  );

  return res.json({ arquivo: arquivos});
});
//#endregion

//#region Alterar
router.post('/alter', upload.single('arquivo'), async (req, res) => {
  try {
  const {uuid} = req.body;

  // Validação dos dados obrigatórios
  if (!uuid) return res.status(400).json({ message: 'UUID é obrigatório' });

  // Verifica se o arquivo foi enviado
  const { originalname, mimetype, buffer } = req.file;

  // Busca o arquivo existente com o uuid fornecido
  const arquivoExistente = await Arquivo.findOne({ uuid });

  if (!arquivoExistente) {
    return res.status(404).json({ message: 'Arquivo não encontrado!' });
  }

  // Gerar um novo UUID para o arquivo
  const novoUuid = await obterUuidIncrementado();

  // Atualizar o arquivo com as novas informações, mas manter as antigas
  const arquivoAtualizado = await Arquivo.findOneAndUpdate(
    { uuid },  // Busca pelo UUID antigo
    { 
      uuid: novoUuid.toString(),  // Novo UUID
      nome: originalname,  // Novo nome do arquivo
      tipo: mimetype,  // Novo tipo do arquivo
      arquivo: buffer,  // Novo conteúdo do arquivo
    },
    { new: true }  // Retorna o documento atualizado
  );

  // Retorna a resposta de sucesso com o arquivo atualizado
  res.status(200).json({ message: 'Arquivo atualizado com sucesso', id: arquivoAtualizado._id });
} catch (err) {
  res.status(500).json({ error: err.message });
}});

//#endregion
module.exports = router;
