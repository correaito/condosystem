const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CaixinhaSchema = new Schema({
  data: {
    type: Date,
    required: true,
  },
  valor: {
    type: Number,
    required: true,
    min: 0, // Garante que o valor seja positivo
  },
  descricao: {
    type: String,
    required: true,
  },
}); 

// e aqui vamos exportar esse módulo
module.exports = mongoose.model("Caixinha", CaixinhaSchema);
