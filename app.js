const express = require("express");
const { appendFile } = require("fs");
const app = express();
const session = require("express-session");
const { engine } = require("express-handlebars");
const usuarios = require("./routes/usuario");
const admin = require("./routes/admin");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const handlebars = require("handlebars");
const passport = require("passport");
const moment = require("moment");
require("moment/locale/pt-br");
moment.locale("pt-br");
require("./config/auth")(passport);

const Caixinha = require("./models/Caixinha");
const TipoDespesa = require("./models/TipoDespesa");
const Despesa = require("./models/Despesa");
const Conta = require("./models/Conta");
const Morador = require("./models/Morador");
const Saldo = require("./models/Saldo");
const Pagamento = require("./models/Pagamento");
const DespesaConta = require("./models/DespesaConta");

//Sessão
app.use(
  session({
    secret: "appdecondominio",
    resave: true,
    saveUninitialized: true,
  })
);

// Body Parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure o Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Midlewares
app.use(flash());
app.use((req, res, next) => {
  // aqui definimos as variáveis globais
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.user || null;
  res.locals.email = req.user ? req.user.email : null;
  res.locals.nome = req.user ? req.user.nome : null;
  res.locals.foto = req.user ? req.user.foto : null;
  res.locals.id = req.user ? (req.user._id ? req.user._id.toString() : req.user.id) : null;
  // verificar se o usuário é um administrador
  res.locals.isAdmin = req.user && req.user.eAdmin === 1;

  // Debugging

  next();
});

//Helpers
handlebars.registerHelper("ifId", function (v1, v2, options) {
  return v1 == v2 ? options.fn() : options.inverse();
});

// Helper para formatar a data como DD/MM/YYYY
handlebars.registerHelper("formatDate", function (date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0"); // Os meses são indexados em 0
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
});

// para carregamento campo tipo_despesa na edição da despesa
handlebars.registerHelper("ifEqual", function (a, b, options) {
  return a == b ? options.fn(this) : options.inverse(this);
});

// Definir engine handlebars
app.engine(
  "handlebars",
  engine({
    defaultLayout: "main",
    helpers: {
      formatDate: (date) => moment(date).format("DD/MM/YYYY"),
      formatDateInput: (date) => moment(date).format("YYYY-MM-DD"),
      formatDateHour: (date) => moment(date).format("DD/MM/YYYYY - HH:MM"),

      // Registra o helper 'eq'
      eq: function (arg1, arg2) {
        return arg1 === arg2;
      },
      // Helper para converter para string
      toString: function (arg) {
        return arg ? String(arg) : '';
      },
    },
  })
);
app.set("view engine", "handlebars");

// Conexão ao bd (Mongoose)
// Defina a opção strictQuery para evitar o aviso de depreciação
mongoose.set("strictQuery", true); // ou false, dependendo da sua preferência

// Conf do Servidor
const PORT = process.env.PORT || 8081;

mongoose
  .connect("mongodb://localhost/condominioapp")
  .then(() => {
    console.log("Conectado ao MongoDB com sucesso!");
    // Inicia o servidor apenas após a conexão bem-sucedida
    app.listen(PORT, () => {
      console.log("Servidor Rodando");
      console.log(`Acesse o projeto em: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Erro ao se conectar com o banco de dados: " + err);
    process.exit(1); // Encerra o processo se não conseguir conectar
  });

// Midlewares das rotas
app.use("/usuarios", usuarios);
app.use("/admin", admin);

//Public
// Aqui entregamos ao express o arquivo estático, publico
app.use(express.static(path.join(__dirname, "public")));

// Middleware para verificar se o usuário está autenticado
// se não estiver, envia para a rota de login
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/usuarios/login");
}

// Rota para a página inicial após o login
app.get("/", isAuthenticated, (req, res) => {
  res.redirect("/usuarios/dashboard");
});

// Rota de logout
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/usuarios/login");
});

// Exportar app e models como propriedades de um objeto
module.exports = {
  app,
  models: {
    Caixinha,
    TipoDespesa,
    Despesa,
    Conta,
    Morador,
    Saldo,
    Pagamento,
    DespesaConta,
  },
};
