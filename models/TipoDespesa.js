const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  nome: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  classificacao: {
    type: String,
    required: false,
  },
  caixinha: { 
    type: String,
    enum: ["Nenhum", "Somar", "Subtrair"],
    default: "Nenhum",
  },
  caixinhaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Caixinha", // Referência ao model Caixinha
    required: function() { 
      return (this.caixinha === "Somar" || this.caixinha === "Subtrair");
    }, // Obrigatório se caixinha for "Somar" ou "Subtrair"
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

// e aqui vamos exportar esse módulo
module.exports = mongoose.model("TipoDespesa", categorySchema);