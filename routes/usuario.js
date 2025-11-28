const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const passport = require("passport");
require("../models/Usuario");
const Usuario = mongoose.model("Usuario");
const { eAutenticado } = require("../helpers/eAdmin");
const Despesa = require("../models/Despesa");
const Morador = require("../models/Morador");
const TipoDespesa = require("../models/TipoDespesa");
const Caixinha = require("../models/Caixinha");
const Conta = require("../models/Conta");
const moment = require('moment');
const multer = require('multer');
const path = require('path');

// Configuração do Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/img/usuarios/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// rota para carregar a tela de login
router.get("/login", (req, res) => {
  res.render("./usuarios/login");
});

// rota para carregar a tela de index
router.get("/index", eAutenticado, (req, res) => {
  res.redirect("/usuarios/dashboard");
});


// quando o usuario fizer a autenticação com sucesso enviamos a mensagem de sucesso
// do contrario redirecionamos para rota login novamente
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/usuarios/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success_msg", "Logado com sucesso!");
    res.redirect("/usuarios/dashboard");
  }
);

router.get("/logout", (req, res, next) => {
  // desde a versão 6 do passport, temos que criar uma funcao assincrona para efetuar ao logout
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success_msg", "Deslogado com sucesso!");
    res.redirect("/");
  });
});


// carrega a tela de login
router.get("/login", (req, res) => {
  res.render("usuarios/login");
});


// carrega a tela de registro
router.get("/registro", (req, res) => {
  res.render("usuarios/registro");
});

// rota que registra efetivamente um novo usuario no sistema
router.post("/registro", async (req, res) => {
  var erros = [];

  if (
    !req.body.nome ||
    typeof req.body.nome == undefined ||
    req.body.nome == null
  ) {
    erros.push({ texto: "Nome inválido" });
  }

  if (
    !req.body.email ||
    typeof req.body.email == undefined ||
    req.body.email == null
  ) {
    erros.push({ texto: "E-mail inválido" });
  }

  if (
    !req.body.senha ||
    typeof req.body.senha == undefined ||
    req.body.senha == null
  ) {
    erros.push({ texto: "Senha inválida" });
  }

  if (req.body.senha.length < 4) {
    erros.push({ texto: "Senha muito curta" });
  }
  if (req.body.senha != req.body.senha2) {
    erros.push({ texto: "As senhas são diferentes, tente novamente!" });
  }
  if (erros.length > 0) {
    res.render("usuarios/registro", { erros: erros });
  } else {
    try {
      const usuario = await Usuario.findOne({ email: req.body.email });
      if (usuario) {
        req.flash(
          "error_msg",
          "Já existe uma conta com esse e-mail no nosso sistema"
        );
        res.redirect("/usuarios/registro");
      } else {
        // Verifica quantos usuários existem no banco
        const count = await Usuario.countDocuments();

        // Se for o primeiro usuário (count === 0), define como admin (eAdmin = 1)
        // Caso contrário, define como usuário comum (eAdmin = 0)
        const eAdmin = count === 0 ? 1 : 0;

        const novoUsuario = new Usuario({
          nome: req.body.nome,
          telefone: req.body.telefone,
          apto: req.body.apto,
          email: req.body.email,
          senha: req.body.senha,
          eAdmin: eAdmin
        });

        bcrypt.genSalt(10, (erro, salt) => {
          bcrypt.hash(novoUsuario.senha, salt, (erro, hash) => {
            if (erro) {
              req.flash(
                "error_msg",
                "Houve um erro durante do salvamento do usuario"
              );
              res.redirect("/");
            }

            novoUsuario.senha = hash;
            novoUsuario
              .save()
              .then(() => {
                req.flash("success_msg", "Usuario criado com sucesso!");
                res.redirect("/usuarios/login");
              })
              .catch((err) => {
                req.flash(
                  "error_msg",
                  "Houve um erro ao criar o usuário! Tente novamente!"
                );
                res.redirect("/usuarios/registro");
              });
          });
        });
      }
    } catch (err) {
      req.flash("error_msg", "Houve um erro interno");
      res.redirect("/");
    }
  }
});

// rota para visualizar os dados cadastrais do usuario
router.get("/dados_conta", eAutenticado, (req, res) => {
  const usuarioId = req.user._id ? req.user._id.toString() : req.user.id;
  // console.log("Rendering dados_conta with ID:", usuarioId); // Debug
  res.render("./usuarios/account/dados_conta", { id: usuarioId });
});

// endpoint que grava as alterações cadastrais do usuario
router.post("/altera_cadastro/:id", eAutenticado, upload.single('foto'), async (req, res) => {
  try {
    // 1. Buscar o usuário ATUAL antes de atualizar para pegar o nome antigo
    const usuarioAntigo = await Usuario.findById(req.params.id);

    if (!usuarioAntigo) {
      req.flash("error_msg", "Usuário não encontrado.");
      return res.redirect("/usuarios/dados_conta");
    }

    const nomeAntigo = usuarioAntigo.nome;
    const novoNome = req.body.nome;
    const novoEmail = req.body.email;
    let novaFoto = usuarioAntigo.foto;

    if (req.file) {
      novaFoto = req.file.filename;
    }

    // 2. Atualizar o Usuário
    await Usuario.findByIdAndUpdate(
      req.params.id,
      { nome: novoNome, email: novoEmail, foto: novaFoto },
      { new: true }
    );

    // 3. Se o nome mudou, atualizar o Morador vinculado
    if (nomeAntigo !== novoNome) {
      const moradorVinculado = await Morador.findOne({ nome: nomeAntigo });

      if (moradorVinculado) {
        moradorVinculado.nome = novoNome;
        // Se o email também mudou, podemos atualizar no morador também (opcional, mas recomendado)
        if (novoEmail) {
          moradorVinculado.email = novoEmail;
        }
        await moradorVinculado.save();
        console.log(`Morador atualizado: ${nomeAntigo} -> ${novoNome}`);
      } else {
        console.log(`Nenhum morador encontrado com o nome: ${nomeAntigo} para sincronização.`);
      }
    }

    req.flash("success_msg", "Cadastro de Usuário atualizado com sucesso!");
    res.redirect("/usuarios/dados_conta");
  } catch (err) {
    console.error(err);
    req.flash(
      "error_msg",
      "Houve um erro interno ao tentar atualizar o cadastro!"
    );
    res.redirect("/usuarios/dados_conta");
  }
});

// carrega a tela de alteração da senha do usuario
router.get("/altera_senha", eAutenticado, (req, res) => {
  res.render("./usuarios/account/altera_senha");
});

// endpoint que altera efetivamente a senha do usuario
router.post("/alterar_senha", async (req, res) => {
  try {
    const { senhaAtual, novaSenha, confirmacaoSenha } = req.body;
    const usuario = await Usuario.findOne({ email: req.user.email });

    if (!usuario) {
      req.flash("error_msg", "Usuário não encontrado!");
      return res.redirect("/usuarios/altera_senha");
    }

    // Verificar se a senha atual fornecida corresponde à senha armazenada no banco de dados
    const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);

    if (!senhaCorreta) {
      req.flash("error_msg", "Senha atual incorreta!");
      return res.redirect("/usuarios/altera_senha");
    }

    // Verificar se a nova senha e a confirmação de senha correspondem e atendem aos critérios de segurança
    if (novaSenha !== confirmacaoSenha) {
      req.flash("error_msg", "As senhas não coincidem!");
      return res.redirect("/usuarios/altera_senha");
    }
    // Verificar se a senha tem pelo menos 6 caracteres
    if (novaSenha.length < 6) {
      req.flash("error_msg", "A nova senha deve ter pelo menos 6 caracteres!");
      return res.redirect("/usuarios/altera_senha");
    }

    // Criptografar a nova senha antes de salvá-la no banco de dados
    const salt = await bcrypt.genSalt(10);
    const hashNovaSenha = await bcrypt.hash(novaSenha, salt);

    // Atualizar a senha do usuário no banco de dados
    usuario.senha = hashNovaSenha;
    await usuario.save();

    req.flash("success_msg", "Senha alterada com sucesso!");
    res.redirect("/usuarios/altera_senha");
  } catch (error) {
    console.error(error);
    req.flash(
      "error_msg",
      "Houve um erro interno ao tentar atualizar a senha!"
    );
    res.redirect("/usuarios/altera_senha");
  }
});

// Rota para exibir a página de visualização da despesa
router.get("/visualizar_despesa/:id", eAutenticado, async (req, res) => {
  try {
    const despesa = await Despesa.findById(req.params.id).lean(); // Busca a despesa pelo ID
    const formattedDate = despesa.date.toISOString().split("T")[0]; // Formatar a data para YYYY-MM-DD
    const tiposDespesas = await TipoDespesa.find().lean();

    if (!despesa) {
      req.flash("error_msg", "Despesa não encontrada.");
      return res.redirect("/admin/listar_despesas");
    }

    res.render("./usuarios/visualizar_despesa", {
      despesa,
      formattedDate,
      tiposDespesas,
    }); // Renderiza a view de edição com os dados da despesa
  } catch (error) {
    console.error(error);
    req.flash(
      "error_msg",
      "Ocorreu um erro ao carregar a página de visualização da despesa."
    );
    res.redirect("/usuarios/index");
  }
});


// Rota para o dashboard do usuário
router.get("/dashboard", eAutenticado, async (req, res) => {
  try {
    // Obter o usuário logado
    const usuario = await Usuario.findOne({ email: req.user.email }).lean();

    // Verificar se o usuário foi encontrado
    if (!usuario) {
      req.flash("error_msg", "Usuário não encontrado.");
      return res.redirect("/usuarios/index");
    }

    // Verificar se o usuário é admin
    const isAdmin = usuario.eAdmin;

    let totalContasPendentes = 0;
    let saldo = 0;
    let contas = [];
    let ultimasContas = [];
    let labelsMeses = [];
    let valoresContas = [];
    let despesas = [];
    let despesasLabels = [];
    let despesasValores = [];
    let moradorNaoEncontrado = false;

    if (isAdmin) {
      // Lógica para admin
      const contasPendentes = await Conta.aggregate([
        { $match: { situacao: 'A Pagar' } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$valor" } } } }
      ]);
      totalContasPendentes = contasPendentes.length > 0 ? contasPendentes[0].total : 0;

      const moradores = await Morador.find().lean();
      saldo = moradores.reduce((sum, morador) => sum + parseFloat(morador.saldo || 0), 0);

      const threeMonthsAgo = moment().subtract(3, 'months').startOf('month').toDate();
      const contasAgrupadas = await Conta.aggregate([
        { $match: { data: { $gte: threeMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$data" } },
            totalValor: { $sum: { $toDouble: "$valor" } }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 3 }
      ]);

      labelsMeses = contasAgrupadas.map(item => moment(item._id).format('MMMM YYYY'));
      valoresContas = contasAgrupadas.map(item => item.totalValor);

      despesas = await Despesa.find().sort({ data: -1 }).limit(3).lean();
    } else {
      // Lógica para usuário normal
      const morador = await Morador.findOne({ nome: usuario.nome }).lean();

      if (morador) {
        contas = await Conta.find({ morador: morador._id }).lean();
        totalContasPendentes = contas.filter(conta => conta.situacao === 'A Pagar').reduce((sum, conta) => sum + parseFloat(conta.valor), 0);
        saldo = morador.saldo;

        ultimasContas = await Conta.find({ morador: morador._id }).sort({ data: -1 }).limit(3).lean();
        labelsMeses = [...new Set(ultimasContas.map(conta => moment(conta.data).format('MMMM YYYY')))];
        valoresContas = ultimasContas.map(conta => parseFloat(conta.valor));
      } else {
        // Se não encontrar morador vinculado, zera os valores para não quebrar a view
        // req.flash("error_msg", "Seu usuário ainda não está vinculado a um Morador. Entre em contato com o síndico.");
        contas = [];
        totalContasPendentes = 0;
        saldo = 0;
        ultimasContas = [];
        labelsMeses = [];
        valoresContas = [];
        moradorNaoEncontrado = true;
      }
    }

    // Obter todas as caixinhas
    const caixinhas = await Caixinha.find().lean();
    const totalCaixinhas = caixinhas.reduce((sum, caixinha) => sum + parseFloat(caixinha.valor), 0);

    // Obter todas as despesas do mês atual
    // Ajuste para corresponder ao formato salvo no banco (ex: Out/2025)
    // O moment 'MMM/YYYY' com locale pt-br vai gerar 'out./2025' ou 'out/2025' dependendo da versão
    // Vamos garantir que a primeira letra seja maiúscula e remover o ponto se houver
    let currentMonth = moment().format('MMM/YYYY');
    currentMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1).replace('.', '');

    // Se no banco estiver salvo como 'Out/2025', precisamos garantir que o formato bata
    // Vamos tentar buscar com regex para ser mais flexível ou ajustar conforme o padrão exato
    const todasDespesas = await Despesa.find({
      competencia: { $regex: new RegExp(currentMonth, 'i') }
    }).lean();


    // Agrupar despesas por descrição
    const despesasAgrupadas = todasDespesas.reduce((acc, despesa) => {
      if (!acc[despesa.descricao]) {
        acc[despesa.descricao] = 0;
      }
      acc[despesa.descricao] += parseFloat(despesa.valor);
      return acc;
    }, {});

    // Preparar dados para o gráfico de pizza
    despesasLabels = Object.keys(despesasAgrupadas);
    despesasValores = Object.values(despesasAgrupadas);

    res.render("./usuarios/dashboard", {
      usuario,
      isAdmin,
      contas: isAdmin ? despesas : ultimasContas,
      totalContasPendentes,
      totalCaixinhas,
      labelsMeses: JSON.stringify(labelsMeses),
      valoresContas: JSON.stringify(valoresContas),
      saldo,
      despesasLabels: JSON.stringify(despesasLabels),
      despesasValores: JSON.stringify(despesasValores),
      moradorNaoEncontrado
    });

  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao carregar o dashboard.");
    res.redirect("/usuarios/index");
  }
});


module.exports = router;
