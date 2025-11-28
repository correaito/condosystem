const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MovimentoCaixinhaSchema = new Schema({
  caixinha: { // Novo campo para armazenar o ID do Caixinha
    type: Schema.Types.ObjectId,
    ref: 'Caixinha',
    required: true
  },
  data: {
    type: Date,
    required: true,
  },
  valor: {
    type: Number,
    required: true,
  },
  movimento: {
    type: String,
    enum: ["Entrada", "Saida"],
    required: true,
  },
  descricao: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("MovimentoCaixinha", MovimentoCaixinhaSchema);