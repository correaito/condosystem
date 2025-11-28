const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  nome: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
  },
  apto: {
    type: String,
    required: true,
  },
  telefone: {
    type: String,
    required: false,
  },
  situacao: { // Mudamos 'inquilino' para 'situacao'
    type: String,
    enum: ['Proprietário', 'Proprietário Morador', 'Inquilino'], // Valores permitidos
    required: true,
  },
  saldo: { 
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("Morador", categorySchema);