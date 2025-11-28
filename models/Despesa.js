const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  descricao: {
    type: String,
    required: true,
  },
  valor: {
    type: String,
    required: true, 
  },
  conta: {
    type: Number,
    required: false,
  },
  tipodespesa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoDespesa',
    required: false
  },
  competencia: {
    type: String,
    required: false,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

// e aqui vamos exportar esse módulo
module.exports = mongoose.model("Despesa", categorySchema);