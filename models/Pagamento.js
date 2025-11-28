const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  morador: {
    type: Schema.Types.ObjectId,
    ref: "Morador",
    required: true,
  },
  valor: {
    type: String,
    required: true,
  },
  conta: {
    type: Number,
    required: true,
  },
  data: {
    type: Date,
    default: Date.now(),
  },
});

// e aqui vamos exportar esse módulo
module.exports = mongoose.model("Pagamento", categorySchema);