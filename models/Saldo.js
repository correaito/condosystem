const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  morador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Morador",
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
  situacao: {
    type: String,
    required: false,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

// e aqui vamos exportar esse módulo
module.exports = mongoose.model("Saldo", categorySchema);