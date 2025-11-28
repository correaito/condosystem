const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contaSchema = new Schema({
  numero: {
    type: Number,
    required: true,
  },
  data: {
    type: Date,
    required: true,
  },
  morador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Morador",
    required: true,
  },
  competencia: {
    type: String,
    required: true,
  },
  situacao: {
    type: String,
    required: true,
    default: "A Pagar",
  },
  observacao: {
    type: String,
    required: false,
  },
  valor: {
    type: Number,
    required: true,
  },
});

// e aqui vamos exportar esse módulo
module.exports = mongoose.model("Conta", contaSchema);
