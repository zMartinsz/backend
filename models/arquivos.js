const mongoose = require('mongoose');

const ArquivoSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // ID custom passado pelo cliente
  nome: { type: String, required: true },
  arquivo: { type: Buffer, required: true },
  tipo: { type: String, required: true },
  criadoEm: { type: Date, default: Date.now },
  cargo: { type: [String], default: ["adm"], required: true}
}, { _id: false }); // desliga ObjectId automático

module.exports = mongoose.model('Arquivo', ArquivoSchema);
