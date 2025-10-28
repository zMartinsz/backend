const mongoose = require('mongoose');

const ArquivoSchema = new mongoose.Schema({
  uuid: { type: String, required: true},
  _id: { type: String, required: true}, // ID custom passado pelo cliente
  nome: { type: String, required: true },
  arquivo: { type: Buffer, required: true },
  tipo: { type: String, required: true },
  cargo: { type: [String], default: ["adm"], required: true},
  empresa: { type: [String], default: ["Telsite"], required: true}
}); // desliga ObjectId automático

module.exports = mongoose.model('Arquivo', ArquivoSchema);
