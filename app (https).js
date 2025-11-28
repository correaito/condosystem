const express = require("express");
const { appendFile } = require("fs");
const app = express();
const session = require("express-session");
const { engine } = require("express-handlebars");
const usuarios = require("./routes/usuario");
const admin = require("./routes/admin");
const path = require("path");
const bodyParser = require("body-parser");
const { default: mongoose } = require("mongoose");
const flash = require("connect-flash");
const handlebars = require("handlebars");
const passport = require('passport');
const moment = require("moment");
const https = require('https');
const http = require('http');
const fs = require('fs');
require("./config/auth")(passport);

// Configuração HTTPS
const options = {
  key: fs.readFileSync(path.join(__dirname, 'keys', 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'keys', 'localhost.pem'))
};

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
  res.locals.id = req.user ? req.user.id : null;
  // verificar se o usuário é um administrador
  res.locals.isAdmin = req.user && req.user.eAdmin === 1;
  next();
});

//Helpers
handlebars.registerHelper("ifId", function (v1, v2, options) {
  return v1 == v2 ? options.fn() : options.inverse();
});

handlebars.registerHelper('formatDate', function(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
});

handlebars.registerHelper('ifEqual', function(a, b, options) {
  return (a == b) ? options.fn(this) : options.inverse(this);
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
    },
  })
);
app.set("view engine", "handlebars");

// Conexão ao bd (Mongoose)
mongoose.set('strictQuery', true);

// Conf do Servidor
const HTTPS_PORT = process.env.HTTPS_PORT || 8081;
const HTTP_PORT = process.env.HTTP_PORT || 8080;

mongoose
  .connect("mongodb://localhost/condominioapp")
  .then(() => {
    console.log("Conectado ao MongoDB com sucesso!");
    
    // Criar servidores HTTP e HTTPS apenas após a conexão bem-sucedida
    const httpsServer = https.createServer(options, app);
    const httpServer = http.createServer((req, res) => {
      res.writeHead(301, { "Location": "https://" + req.headers['host'].replace(HTTP_PORT.toString(), HTTPS_PORT.toString()) + req.url });
      res.end();
    });

    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`Servidor HTTPS Rodando na porta ${HTTPS_PORT}`);
    });

    httpServer.listen(HTTP_PORT, () => {
      console.log(`Servidor HTTP redirecionando para HTTPS na porta ${HTTP_PORT}`);
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
app.use(express.static(path.join(__dirname, "public")));

// Middleware para verificar se o usuário está autenticado
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/usuarios/login');
}

// Rota para a página inicial após o login
app.get('/', isAuthenticated, (req, res) => {
  res.render('usuarios/login');
});

// Rota de logout
app.get('/logout', function(req, res) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/usuarios/login');
  });
});

app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});