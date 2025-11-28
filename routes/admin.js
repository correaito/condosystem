const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { eAdmin } = require("../helpers/eAdmin");
const { eAutenticado } = require("../helpers/eAdmin");
const Usuario = require("../models/Usuario");
const Morador = require("../models/Morador");
const Despesa = require("../models/Despesa");
const TipoDespesa = require("../models/TipoDespesa");
const Conta = require("../models/Conta");
const Pagamento = require("../models/Pagamento");
const Saldo = require("../models/Saldo");
const ObjectId = mongoose.Types.ObjectId;
const PDFDocument = require("pdfkit");
const moment = require('moment-timezone');
const Caixinha = require("../models/Caixinha");
const MovimentoCaixinha = require("../models/MovimentoCaixinha");
const DespesaConta = require('../models/DespesaConta');

// rota usada para carregar os usuarios registrados do bd no campo 'usuario' da tela /usuarios/altera_nivel
router.get("/usuarios/:nome", async (req, res) => {
  const nome = req.params.nome;
  const usuarios = await Usuario.find({
    nome: new RegExp(`^${nome}`, "i"),
  }).limit(10);
  const nomesUsuarios = usuarios.map((usuario) => usuario.nome);
  res.json(nomesUsuarios);
});

// rota para alterar o nível do usuario no sistema (user/admin)
router.get("/altera_nivel", eAdmin, (req, res) => {
  res.render("./admin/altera_nivel");
});

// rota que altera efetivamente o nível do usuário no sistema (user/admin)
router.post("/alterar_usuario", async (req, res) => {
  const nome = req.body.nome;
  const nivel = req.body.nivel;

  try {
    if (nome) {
      await Usuario.findOneAndUpdate(
        { nome: nome },
        { $set: { eAdmin: nivel } }
      );

      req.flash("success_msg", "Nível de usuário atualizado com sucesso!");
      res.redirect("/admin/altera_nivel");
    } else {
      console.log("Nome do usuário não fornecido");
    }
  } catch (error) {
    req.flash("error_msg", "Ocorreu um erro ao atualizar o nível do usuário!");
    res.redirect("/admin/altera_nivel");
  }
});

// Rota para a tela de lançar nova despesa geral
router.get("/lancar_despesa_geral", eAutenticado, eAdmin, async (req, res) => {
  try {
    const tiposDespesas = await TipoDespesa.find().lean(); // Buscar todos os tipos de despesas
    res.render("./admin/lancar_despesa_geral", { tiposDespesas });
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Erro ao carregar tipos de despesas!");
    res.redirect("/admin");
  }
});

// rota para cadastrar novos "moradores"
router.get("/cadastros/moradores", eAdmin, (req, res) => {
  res.render("./admin/cadastros/moradores");
});

// Rota para carregar a tela de cadastro de Tipo de Despesa
router.get("/cadastros/tipos_despesas", eAdmin, async (req, res) => {
  try {
    // Busca todos os Caixinhas para exibir no select
    const caixinhas = await Caixinha.find().lean();

    res.render("./admin/cadastros/tipos_despesas", { caixinhas });
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao carregar os dados!");
    res.redirect("/admin");
  }
});


// rota para cadastrar efetivamente novos "moradores"
router.post("/cadastra_morador", async (req, res) => {
  try {
    const { nome, email, apto, telefone, saldo, situacao } = req.body; // 'situacao' em vez de 'inquilino'

    const novoMorador = {
      nome: nome,
      email: email,
      apto: apto,
      telefone: telefone,
      saldo: saldo,
      situacao: situacao, // 'situacao' em vez de 'inquilino'
    };

    await new Morador(novoMorador).save();

    req.flash("success_msg", "Morador cadastrado com sucesso!");
    res.redirect("/admin/cadastros/moradores");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao cadastrar o morador!");
    res.redirect("/admin/cadastros/moradores");
  }
});

// rota para cadastrar nova despesa
router.post("/lancar_despesa_geral", eAdmin, async (req, res) => {
  try {
    const { tipoDespesa, valor, competencia } = req.body;

    // Substitui vírgula por ponto no valor
    const valorFormatado = valor.replace(",", ".");

    // Procurar pelo ObjectId do tipoDespesa usando a descrição
    const tipoDespesaObj = await TipoDespesa.findOne({ nome: tipoDespesa });

    if (!tipoDespesaObj) {
      req.flash("error_msg", "Tipo de despesa não encontrado.");
      return res.redirect("/admin/lancar_despesa_geral");
    }

    const novaDespesa = new Despesa({
      descricao: tipoDespesa, // Mantém a descrição original para exibição
      valor: valorFormatado,
      competencia: competencia,
      tipodespesa: tipoDespesaObj._id, // Salva o ObjectId de tipoDespesa
    });

    await novaDespesa.save();

    req.flash("success_msg", "Despesa cadastrada com sucesso!");
    res.redirect("/admin/lancar_despesa_geral");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao cadastrar a despesa.");
    res.redirect("/admin/lancar_despesa_geral");
  }
});

// rota para cadastrar efetivamente novos "Tipos de Despesas"
router.post("/cadastra_tipo", async (req, res) => {
  try {
    const { nome, slug, classificacao, caixinha, caixinhaId } = req.body;

    const novoTipo = {
      nome: nome,
      slug: slug,
      classificacao: classificacao,
      caixinha: caixinha,
    };

    // Somente adicionar caixinhaId se for "Somar" ou "Subtrair"
    if (caixinha === "Somar" || caixinha === "Subtrair") {
      novoTipo.caixinhaId = caixinhaId;
    }

    await new TipoDespesa(novoTipo).save();

    req.flash("success_msg", "Tipo de despesa cadastrado com sucesso!");
    res.redirect("/admin/cadastros/tipos_despesas");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao cadastrar o Tipo de Despesa!");
    res.redirect("/admin/cadastros/tipos_despesas");
  }
});


// Rota para listar todos os moradores
router.get("/cadastros/listar_moradores", eAdmin, async (req, res) => {
  try {
    const moradores = await Morador.find().lean(); // Busca todos os moradores no banco de dados

    res.render("./admin/cadastros/listar_moradores", { moradores }); // Renderiza a view com os moradores encontrados
  } catch (error) {
    console.error(error);
    // Redireciona para o dashboard ou página de erro, conforme necessário
    req.flash("error_msg", "Ocorreu um erro ao listar os moradores.");
    res.redirect("./usuarios/index");
  }
});

// Rota para exibir a página de edição do morador
router.get("/editar_morador/:id", eAdmin, async (req, res) => {
  try {
    const morador = await Morador.findById(req.params.id).lean(); // Busca o morador pelo ID

    if (!morador) {
      req.flash("error_msg", "Morador não encontrado.");
      return res.redirect("/admin/cadastros/listar_moradores");
    }

    res.render("./admin/cadastros/editar_morador", { morador }); // Renderiza a view de edição com os dados do morador
  } catch (error) {
    console.error(error);
    req.flash(
      "error_msg",
      "Ocorreu um erro ao carregar a página de edição do morador."
    );
    res.redirect("/admin/cadastros/listar_moradores");
  }
});

// Rota para efetivar as alterações do morador
router.post("/cadastros/editar_morador/:id", eAdmin, async (req, res) => {
  try {
    const { nome, email, apto, telefone, situacao, saldo } = req.body; // 'situacao' em vez de 'inquilino'

    let morador = await Morador.findById(req.params.id);

    if (!morador) {
      req.flash("error_msg", "Morador não encontrado.");
      return res.redirect("/admin/cadastros/listar_moradores");
    }

    // Atualiza os campos do morador
    morador.nome = nome;
    morador.email = email;
    morador.apto = apto;
    morador.telefone = telefone;
    morador.situacao = situacao; // 'situacao' em vez de 'inquilino'
    morador.saldo = saldo;

    await morador.save();

    req.flash("success_msg", "Morador atualizado com sucesso!");
    res.redirect("/admin/cadastros/listar_moradores");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao atualizar o morador.");
    res.redirect("/admin/cadastros/listar_moradores");
  }
});

// Rota para excluir um morador
router.get("/excluir_morador/:id", eAdmin, async (req, res) => {
  try {
    await Morador.findByIdAndDelete(req.params.id); // Exclui o morador pelo ID

    req.flash("success_msg", "Morador excluído com sucesso!");
    res.redirect("/admin/cadastros/listar_moradores");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao excluir o morador.");
    res.redirect("/admin/cadastros/listar_moradores");
  }
});

// Rota para listar todas as despesas
router.get("/listar_despesas", eAutenticado, async (req, res) => {
  try {
    const despesas = await Despesa.find().lean(); // Busca todas as despesas no banco de dados

    res.render("./admin/listar_despesas", { despesas }); // Renderiza a view com as despesas encontradas
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao listar as despesas.");
    res.redirect("/admin/index"); // Redireciona para o dashboard ou página de erro, conforme necessário
  }
});

// Rota para exibir a página de edição da despesa
router.get("/editar_despesa/:id", eAdmin, async (req, res) => {
  try {
    const despesa = await Despesa.findById(req.params.id).lean(); // Busca a despesa pelo ID
    const formattedDate = despesa.date.toISOString().split("T")[0]; // Formatar a data para YYYY-MM-DD
    const tiposDespesas = await TipoDespesa.find().lean();

    if (!despesa) {
      req.flash("error_msg", "Despesa não encontrada.");
      return res.redirect("/admin/listar_despesas");
    }

    res.render("./admin/editar_despesa", {
      despesa,
      formattedDate,
      tiposDespesas,
    }); // Renderiza a view de edição com os dados da despesa
  } catch (error) {
    console.error(error);
    req.flash(
      "error_msg",
      "Ocorreu um erro ao carregar a página de edição da despesa."
    );
    res.redirect("/admin/listar_despesas");
  }
});

// Rota para efetivar as alterações da despesa
router.post("/editar_despesa/:id", eAdmin, async (req, res) => {
  try {
    const { descricao, valor, competencia, data } = req.body;

    // Converter a data de DD/MM/YYYY para um objeto Date
    const [day, month, year] = data.split("/");
    const formattedDate = new Date(`${year}-${month}-${day}T00:00:00-03:00`);

    let despesa = await Despesa.findById(req.params.id);

    if (!despesa) {
      req.flash("error_msg", "Despesa não encontrada.");
      return res.redirect("/admin/listar_despesas");
    }

    // Atualiza os campos da despesa
    despesa.descricao = descricao;
    despesa.valor = valor;
    despesa.competencia = competencia;
    despesa.date = formattedDate;

    await despesa.save();

    req.flash("success_msg", "Despesa atualizada com sucesso!");
    res.redirect("/admin/listar_despesas");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao atualizar a despesa.");
    res.redirect("/admin/listar_despesas");
  }
});

// Rota para excluir uma despesa
router.get("/excluir_despesa/:id", eAdmin, async (req, res) => {
  try {
    await Despesa.findByIdAndDelete(req.params.id); // Exclui a despesa pelo ID

    req.flash("success_msg", "Despesa excluída com sucesso!");
    res.redirect("/admin/listar_despesas");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao excluir a despesa.");
    res.redirect("/admin/listar_despesas");
  }
});

// rota para carregar a tela de faturamento
router.get("/faturamento", eAutenticado, eAdmin, async (req, res) => {
  try {
    const despesas = await Despesa.find().lean();
    const ultimaConta = await Conta.findOne().sort({ numero: -1 });
    const numero = ultimaConta ? ultimaConta.numero + 1 : 1;
    res.render("admin/faturamento", { despesas, numero });
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao carregar o faturamento.");
    res.redirect("/admin");
  }
});

function distribuirValor(total, quantidade) {
  const valorEmCentavos = Math.round(total * 100);
  const valorBaseCentavos = Math.floor(valorEmCentavos / quantidade);
  let centavosRestantes = valorEmCentavos % quantidade;

  const distribuicao = new Array(quantidade).fill(valorBaseCentavos / 100);

  // Distribui os centavos restantes, adicionando 0.01 a cada item
  let i = 0;
  while (centavosRestantes > 0) {
    distribuicao[i] += 0.01;
    centavosRestantes--;
    i = (i + 1) % quantidade; // Incrementa o índice circularmente
  }

  return distribuicao;
}

// Rota que realiza efetivamente o faturamento (cria as contas)
router.post("/faturamento", eAdmin, async (req, res) => {
  try {
    const { numero, competencia, despesas } = req.body;
    const despesasSelecionadas = await Despesa.find({
      _id: { $in: despesas },
    }).populate("tipodespesa");

    // Atualiza o campo "conta" nas despesas selecionadas
    for (let despesa of despesasSelecionadas) {
      despesa.conta = numero;
      await despesa.save();
    }

    const moradores = await Morador.find();
    const moradoresNaoInquilinos = moradores.filter(
      (m) => m.situacao === "Proprietário" || m.situacao === "Proprietário Morador"
    );

    // Filtro para Moradores que Pagam Ordinária
    const moradoresOrdinaria = moradores.filter(
      (m) => m.situacao === "Inquilino" || m.situacao === "Proprietário Morador"
    );

    const contas = [];

    let totalASerSubtraidoDoCaixinha = 0;

    for (let i = 0; i < moradores.length; i++) {
      let morador = moradores[i];
      let valorTotal = 0;

      for (let despesa of despesasSelecionadas) {

        // Define a quantidade de moradores para o rateio
        let quantidadeMoradoresRateio;

        // Lógica de rateio baseada na 'situacao' do morador
        if (
          despesa.tipodespesa.caixinha === "Subtrair" &&
          (morador.situacao === "Proprietário" ||
            morador.situacao === "Proprietário Morador")
        ) {
          quantidadeMoradoresRateio = moradoresNaoInquilinos.length;
        } else if (
          despesa.tipodespesa.classificacao === "Extraordinaria" &&
          (morador.situacao === "Proprietário" ||
            morador.situacao === "Proprietário Morador")
        ) {
          quantidadeMoradoresRateio = moradoresNaoInquilinos.length;
        } else if (
          despesa.tipodespesa.classificacao === "Ordinaria" &&
          (morador.situacao === "Inquilino" ||
            morador.situacao === "Proprietário Morador")
        ) {
          quantidadeMoradoresRateio = moradoresOrdinaria.length;
        } else {
          // Define quantidadeMoradoresRateio como 0 quando o morador não deve pagar
          quantidadeMoradoresRateio = 0;
        }

        // Para despesas ordinárias, arredondar o valor para cima antes de distribuir
        let valorDespesa = parseFloat(despesa.valor);
        if (despesa.tipodespesa && despesa.tipodespesa.classificacao === "Ordinaria") {
          valorDespesa = Math.ceil(valorDespesa);
        }

        const valoresDivididos = distribuirValor(
          valorDespesa,
          quantidadeMoradoresRateio
        );

        if (
          despesa.tipodespesa &&
          despesa.tipodespesa.caixinha === "Subtrair" &&
          (morador.situacao === "Proprietário" ||
            morador.situacao === "Proprietário Morador") &&
          valoresDivididos.length > 0
        ) {
          const indexNaoInquilino = moradoresNaoInquilinos.indexOf(morador);

          // Verifica se indexNaoInquilino é um índice válido
          if (indexNaoInquilino !== -1) {
            // Lançamento positivo na DespesaConta (sem arredondamento)
            await DespesaConta.create({
              descricao: despesa.descricao,
              valor: valoresDivididos[indexNaoInquilino], // Sem toFixed
              conta: numero,
              morador: morador._id,
              tipodespesa: despesa.tipodespesa._id,
              competencia: competencia,
            });


            // Lançamento negativo (Saldo do Caixinha) na DespesaConta (sem arredondamento)
            await DespesaConta.create({
              descricao: `Saldo do Caixinha - ${despesa.descricao}`,
              valor: -valoresDivididos[indexNaoInquilino], // Sem toFixed
              conta: numero,
              morador: morador._id,
              tipodespesa: despesa.tipodespesa._id,
              competencia: competencia,
            });

            totalASerSubtraidoDoCaixinha +=
              valoresDivididos[indexNaoInquilino];
          }
        } else {
          if (
            (morador.situacao === "Proprietário" ||
              morador.situacao === "Proprietário Morador") &&
            despesa.tipodespesa.classificacao === "Extraordinaria" &&
            valoresDivididos.length > 0
          ) {
            const indexNaoInquilino = moradoresNaoInquilinos.indexOf(morador);


            // Verifica se indexNaoInquilino é um índice válido
            if (indexNaoInquilino !== -1) {
              valorTotal += valoresDivididos[indexNaoInquilino]; // Acumula sem arredondar
              await DespesaConta.create({
                descricao: despesa.descricao,
                valor: valoresDivididos[indexNaoInquilino], // Sem toFixed
                conta: numero,
                morador: morador._id,
                tipodespesa: despesa.tipodespesa._id,
                competencia: competencia,
              });

            }
          } else if (
            despesa.tipodespesa.classificacao !== "Extraordinaria" &&
            (morador.situacao === "Inquilino" ||
              morador.situacao === "Proprietário Morador") &&
            valoresDivididos.length > 0
          ) {
            // <<<--- CORREÇÃO: Usa o índice do morador na lista moradoresOrdinaria --->>>
            const indexOrdinaria = moradoresOrdinaria.indexOf(morador);

            valorTotal += valoresDivididos[indexOrdinaria]; // Acumula sem arredondar
            await DespesaConta.create({
              descricao: despesa.descricao,
              valor: valoresDivididos[indexOrdinaria], // Sem toFixed
              conta: numero,
              morador: morador._id,
              tipodespesa: despesa.tipodespesa._id,
              competencia: competencia,
            });

          }
        }
      }

      // Lógica para lidar com saldo (sem toFixed durante os cálculos)
      let saldoAtual = parseFloat(morador.saldo || 0);
      let situacaoConta = "A Pagar";

      if (saldoAtual !== 0) {
        if (saldoAtual > 0) {
          if (saldoAtual >= valorTotal) {
            const saldoParaProximoMes = saldoAtual - valorTotal; // Sem toFixed aqui
            morador.saldo = saldoParaProximoMes; // Sem toFixed aqui
            valorTotal = 0;
            situacaoConta = "Pago";

            await Saldo.create({
              morador: morador._id,
              valor: saldoParaProximoMes.toFixed(2), // toFixed apenas ao salvar no banco
              conta: numero,
              situacao: "Saldo para Próximo Mês",
            });
          } else {
            valorTotal = valorTotal - saldoAtual; // Sem toFixed aqui
            morador.saldo = 0; // Define como número
          }
        } else {
          valorTotal = valorTotal + Math.abs(saldoAtual); // Sem toFixed aqui
          morador.saldo = 0; // Define como número
        }
      }

      contas.push({
        numero,
        data: new Date(),
        morador: morador._id,
        competencia,
        valor: valorTotal.toFixed(2), // Arredonda apenas o valor total da conta
        situacao: situacaoConta,
      });

      await morador.save();

      if (saldoAtual !== 0) {
        await Saldo.create({
          morador: morador._id,
          valor: saldoAtual.toFixed(2), // toFixed apenas ao salvar no banco
          conta: numero,
          situacao: "Saldo do Mês Anterior",
        });
      }
    }

    // Subtrai o valor total acumulado do Caixinha
    if (totalASerSubtraidoDoCaixinha > 0) {
      const caixinha = await Caixinha.findOne();
      if (caixinha) {
        const novoValorCaixinha =
          parseFloat(caixinha.valor) - totalASerSubtraidoDoCaixinha; // Sem toFixed aqui
        if (novoValorCaixinha < 0) {
          throw new Error(
            `Valor insuficiente no caixinha para cobrir a despesa de R$ ${totalASerSubtraidoDoCaixinha.toFixed(
              2
            )}`
          );
        }
        caixinha.valor = novoValorCaixinha.toFixed(2); // toFixed apenas ao salvar no banco
        await caixinha.save();
      }
    }

    await Conta.insertMany(contas);

    req.flash("success_msg", "Faturamento realizado com sucesso!");
    res.redirect("/admin/faturamento");
  } catch (error) {
    console.error("Erro ao realizar o faturamento:", error);
    req.flash(
      "error_msg",
      `Ocorreu um erro ao realizar o faturamento: ${error.message}`
    );
    res.redirect("/admin/faturamento");
  }
});

// Rota para listar contas
router.get("/listar_contas", eAutenticado, async (req, res) => {
  try {
    let contas;

    if (res.locals.isAdmin) {
      // Se for administrador, listar todas as contas
      // Buscar sem populate primeiro para evitar erro com contas antigas que têm morador como String
      const todasContas = await Conta.find().lean().sort({ numero: "asc" });

      // Separar contas com ObjectId válido das que têm String
      const contasComObjectId = todasContas.filter(conta =>
        conta.morador && mongoose.Types.ObjectId.isValid(conta.morador)
      );

      const contasComString = todasContas.filter(conta =>
        !conta.morador || !mongoose.Types.ObjectId.isValid(conta.morador)
      );

      // Popular apenas as contas com ObjectId válido
      if (contasComObjectId.length > 0) {
        const idsContas = contasComObjectId.map(c => c._id);
        const contasPopuladas = await Conta.find({ _id: { $in: idsContas } })
          .populate('morador')
          .lean()
          .sort({ numero: "asc" });

        // Combinar: contas populadas + contas antigas (com String)
        contas = [...contasPopuladas, ...contasComString];
      } else {
        contas = contasComString;
      }
    } else {
      // Se não for administrador, buscar o morador pelo nome e listar apenas as contas do usuário logado
      const morador = await Morador.findOne({ nome: res.locals.nome }).lean();
      if (morador) {
        contas = await Conta.find({ morador: morador._id }).populate('morador').lean().sort({ numero: "asc" });
      } else {
        contas = [];
      }
    }

    res.render("admin/listar_contas", { contas });
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao listar as contas.");
    res.redirect("/admin");
  }
});


// Rota para editar conta (GET)
router.get("/editar_conta/:id", eAdmin, async (req, res) => {
  try {
    const conta = await Conta.findById(req.params.id).populate('morador').lean();
    if (!conta) {
      req.flash("error_msg", "Conta não encontrada.");
      return res.redirect("/admin/listar_contas");
    }
    // Ajustar para compatibilidade com a view
    const moradores = await Morador.find().lean();
    res.render("admin/editar_conta", { conta, moradores });
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao carregar a conta para edição.");
    res.redirect("/admin/listar_contas");
  }
});

// Rota para editar conta (POST)
router.post("/editar_conta/:id", eAdmin, async (req, res) => {
  try {
    const { data, morador, competencia, situacao, valor, observacao } =
      req.body;
    let conta = await Conta.findById(req.params.id);

    if (!conta) {
      req.flash("error_msg", "Conta não encontrada.");
      return res.redirect("/admin/listar_contas");
    }

    // Se morador for um ObjectId válido, usar diretamente, senão buscar pelo nome
    let moradorId = morador;
    if (!mongoose.Types.ObjectId.isValid(morador)) {
      const moradorObj = await Morador.findOne({ nome: morador });
      if (!moradorObj) {
        req.flash("error_msg", "Morador não encontrado.");
        return res.redirect("/admin/editar_conta/" + req.params.id);
      }
      moradorId = moradorObj._id;
    }

    conta.data = data;
    conta.morador = moradorId;
    conta.competencia = competencia;
    conta.situacao = situacao;
    conta.valor = valor;
    conta.observacao = observacao;

    await conta.save();

    req.flash("success_msg", "Conta atualizada com sucesso!");
    res.redirect("/admin/listar_contas");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao atualizar a conta.");
    res.redirect("/admin/listar_contas");
  }
});

// Rota para excluir conta
router.post("/excluir_conta/:id", eAdmin, async (req, res) => {
  try {
    await Conta.findByIdAndRemove(req.params.id);
    req.flash("success_msg", "Conta excluída com sucesso!");
    res.redirect("/admin/listar_contas");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao excluir a conta.");
    res.redirect("/admin/listar_contas");
  }
});

// Rota para realizar o pagamento da Conta (ajustada para 'situacao')
router.post("/pagar_conta", eAdmin, async (req, res) => {
  try {
    const { contaId, valorPago, valorConta } = req.body;
    const conta = await Conta.findById(contaId).populate('morador');
    const morador = conta.morador;

    // Converte valorPago (com vírgula) para ponto flutuante (com ponto)
    const valorPagoConvertido = parseFloat(valorPago.replace(",", "."));

    if (!conta || !morador) {
      return res
        .status(404)
        .json({ success: false, message: "Conta ou morador não encontrado." });
    }

    const valorPagoDecimal = parseFloat(valorPagoConvertido).toFixed(2);
    const valorContaDecimal = parseFloat(valorConta).toFixed(2);
    const diferenca = (valorPagoDecimal - valorContaDecimal).toFixed(2);
    let saldoAtualizado = (
      parseFloat(morador.saldo || 0) + parseFloat(diferenca)
    ).toFixed(2);

    conta.situacao = "Pago";
    await conta.save();

    morador.saldo = saldoAtualizado;
    await morador.save();

    if (parseFloat(diferenca) !== 0) {
      await Saldo.create({
        morador: morador._id,
        valor: diferenca,
        conta: conta.numero,
        situacao: "Saldo para Próximo Mês",
      });
    }

    // Busca as despesas da conta do morador na coleção DespesaConta
    const despesasContaDoMorador = await DespesaConta.find({
      conta: conta.numero,
      morador: morador._id,
    }).populate("tipodespesa");

    const caixinhasAtualizadas = new Map();

    for (let despesa of despesasContaDoMorador) {
      if (
        despesa.tipodespesa.caixinha === "Somar" &&
        despesa.tipodespesa.classificacao === "Extraordinaria" &&
        (morador.situacao === "Proprietário" ||
          morador.situacao === "Proprietário Morador")
      ) {
        const caixinhaId = despesa.tipodespesa.caixinhaId.toString();
        if (!caixinhasAtualizadas.has(caixinhaId)) {
          caixinhasAtualizadas.set(caixinhaId, {
            caixinha: await Caixinha.findById(caixinhaId),
            valorTotal: 0,
          });
        }

        const info = caixinhasAtualizadas.get(caixinhaId);
        // Usa o valor da despesa do morador diretamente
        const valorDespesa = parseFloat(despesa.valor).toFixed(2);
        info.valorTotal += parseFloat(valorDespesa);
      }
    }

    for (const [caixinhaId, info] of caixinhasAtualizadas) {
      const { caixinha, valorTotal } = info;
      if (caixinha) {
        const valorAtual = parseFloat(caixinha.valor).toFixed(2);
        // Não precisa mais dividir por moradores não inquilinos
        const novoValor = (
          parseFloat(valorAtual) + parseFloat(valorTotal)
        ).toFixed(2);
        caixinha.valor = novoValor;
        await caixinha.save();
      }
    }

    await Pagamento.create({
      morador: morador._id,
      valor: valorPagoDecimal,
      conta: conta.numero,
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Ocorreu um erro ao processar o pagamento.",
    });
  }
});


// Rota para detalhar uma Conta (ajustada para 'situacao')
router.get("/detalhar_conta/:id", eAutenticado, async (req, res) => {
  try {
    const contaId = req.params.id;
    const conta = await Conta.findById(contaId).lean();

    if (!conta) {
      req.flash("error_msg", "Conta não encontrada.");
      return res.redirect("/admin/listar_contas");
    }

    // Verificar se morador é ObjectId válido antes de popular
    let morador;
    let moradorId;

    if (conta.morador && mongoose.Types.ObjectId.isValid(conta.morador)) {
      // Popular apenas se for ObjectId válido
      const contaPopulada = await Conta.findById(contaId).populate('morador').lean();
      morador = contaPopulada.morador;
      moradorId = morador._id || conta.morador;
    } else if (typeof conta.morador === 'object' && conta.morador._id) {
      // Se já vier populado (objeto)
      morador = conta.morador;
      moradorId = morador._id;
    } else {
      // Se for String (conta antiga), buscar morador pelo nome
      morador = await Morador.findOne({ nome: conta.morador }).lean();
      if (morador) {
        moradorId = morador._id;
      } else {
        // Se não encontrar, usar os dados básicos
        morador = { nome: conta.morador, apto: 'N/A' };
        moradorId = null;
      }
    }

    // Buscar todas as despesas da conta e populá-las com os tipos de despesa
    const todasDespesas = await Despesa.find({ conta: conta.numero })
      .lean()
      .populate("tipodespesa")
      .lean();

    // Buscar as despesas da conta relacionadas ao morador específico
    // IMPORTANTE: Buscar apenas despesas desta conta específica (mesmo número de conta E mesmo morador)
    // Isso garante que moradores com mesmo nome mas apartamentos diferentes tenham contas separadas
    let despesasDoMorador = [];

    // Verificar se a conta é antiga (morador como String) ou nova (morador como ObjectId)
    const contaAntiga = !mongoose.Types.ObjectId.isValid(conta.morador);

    if (contaAntiga) {
      // Se for conta antiga (morador como String), buscar despesas por nome do morador
      const nomeMorador = typeof conta.morador === 'string' ? conta.morador : morador?.nome;

      if (nomeMorador) {
        // Buscar despesas que têm morador como String (dados antigos)
        // Como DespesaConta agora usa ObjectId no schema, precisamos buscar diretamente no banco
        // para encontrar despesas antigas que ainda têm morador como String
        const db = mongoose.connection.db;
        const despesasAntigas = await db.collection('despesacontas').find({
          conta: conta.numero,
          morador: nomeMorador
        }).toArray();

        // Converter para o formato esperado e popular tipodespesa se existir
        for (let despesa of despesasAntigas) {
          if (despesa.tipodespesa && mongoose.Types.ObjectId.isValid(despesa.tipodespesa)) {
            const tipoDespesa = await TipoDespesa.findById(despesa.tipodespesa).lean();
            despesa.tipodespesa = tipoDespesa;
          }
        }

        despesasDoMorador = despesasAntigas;

        console.log(`[DEBUG] Conta antiga - Buscando despesas por nome: ${nomeMorador}`);
        console.log(`[DEBUG] Despesas encontradas (antigas): ${despesasDoMorador.length}`);
      }
    } else if (moradorId) {
      // Se for conta nova (morador como ObjectId), buscar normalmente
      const query = {
        conta: conta.numero,
        morador: moradorId,
      };

      // Tentar buscar com competência primeiro
      if (conta.competencia) {
        query.competencia = conta.competencia;
      }

      despesasDoMorador = await DespesaConta.find(query)
        .populate("tipodespesa")
        .lean();

      // Se não encontrou com competência, tentar sem competência (para dados antigos ou inconsistências)
      if (despesasDoMorador.length === 0 && conta.competencia) {
        despesasDoMorador = await DespesaConta.find({
          conta: conta.numero,
          morador: moradorId,
        })
          .populate("tipodespesa")
          .lean();
      }

      console.log(`[DEBUG] Conta nova - Buscando despesas para conta ${conta.numero}, morador ${moradorId}`);
      console.log(`[DEBUG] Despesas encontradas: ${despesasDoMorador.length}`);
    } else {
      console.log(`[DEBUG] Morador sem ID válido - não é possível buscar despesas`);
      despesasDoMorador = [];
    }

    // Filtrar as despesas para incluir as corretas de acordo com a 'situacao' do morador
    // Só filtrar se morador tiver situação definida E tipodespesa estiver populado
    const despesasFiltradas = despesasDoMorador.filter((despesa) => {
      // Se não tiver informação suficiente para filtrar, incluir todas
      if (!morador || !morador.situacao) {
        return true; // Incluir todas se não tiver situação definida
      }

      // Se tipodespesa não estiver populado ou não tiver classificação, incluir todas
      if (!despesa.tipodespesa || !despesa.tipodespesa.classificacao) {
        return true; // Incluir todas se não tiver informação de classificação
      }

      // Aplicar filtros baseados na situação do morador
      if (morador.situacao === "Inquilino") {
        return despesa.tipodespesa.classificacao === "Ordinaria"; // Apenas ordinárias para inquilinos
      } else if (morador.situacao === "Proprietário") {
        return despesa.tipodespesa.classificacao === "Extraordinaria"; // Apenas extraordinárias para proprietários
      } else if (morador.situacao === "Proprietário Morador") {
        return true; // Inclui todas as despesas para "Proprietário Morador"
      }
      return true; // Por padrão, incluir todas (mais seguro)
    });

    // Detalhar as despesas para exibição
    const despesasDetalhadas = despesasFiltradas.map((despesa) => {
      const valor = parseFloat(despesa.valor);

      return {
        _id: despesa._id,
        descricao: despesa.descricao,
        valor: valor.toFixed(2),
        competencia: despesa.competencia || conta.competencia,
      };
    });

    // Debug: Log para verificar se está encontrando despesas
    console.log(`[DEBUG] Conta ${conta.numero} - Morador ${morador?._id || morador?.nome || 'N/A'}`);
    console.log(`[DEBUG] Despesas encontradas: ${despesasDoMorador.length}, Filtradas: ${despesasFiltradas.length}, Detalhadas: ${despesasDetalhadas.length}`);

    // Buscar pagamentos e saldos apenas se morador tiver _id válido
    let pagamentos = [];
    let saldos = [];

    if (morador && morador._id) {
      pagamentos = await Pagamento.find({
        conta: conta.numero,
        morador: morador._id,
      }).lean();

      saldos = await Saldo.find({
        conta: conta.numero,
        morador: morador._id,
      })
        .sort({ date: 1 })
        .lean();
    }

    // Filtrar saldos com valor diferente de zero
    saldos = saldos.filter((saldo) => parseFloat(saldo.valor) !== 0);

    // Garantir que a conta tenha o morador populado para a view
    const contaParaView = {
      ...conta,
      morador: morador || conta.morador
    };

    res.render("admin/detalhar_conta", {
      conta: contaParaView,
      despesas: despesasDetalhadas,
      pagamentos,
      saldos,
    });
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao carregar os detalhes da conta.");
    res.redirect("/admin/listar_contas");
  }
});

// Rota para excluir uma despesa da conta
router.get("/excluir_despesa/:despesaId/:contaId", eAdmin, async (req, res) => {
  try {
    const despesaId = req.params.despesaId;
    const contaId = req.params.contaId;

    const despesa = await DespesaConta.findById(despesaId);
    if (!despesa) {
      req.flash("error_msg", "Despesa não encontrada.");
      return res.redirect(`/admin/detalhar_conta/${contaId}`);
    }

    const conta = await Conta.findById(contaId);
    if (!conta) {
      req.flash("error_msg", "Conta não encontrada.");
      return res.redirect("/admin/listar_contas");
    }

    // Atualiza o valor total da conta
    conta.valor = (parseFloat(conta.valor) - parseFloat(despesa.valor)).toFixed(2);
    await conta.save();

    // Exclui a despesa
    await DespesaConta.findByIdAndDelete(despesaId);

    req.flash("success_msg", "Despesa excluída com sucesso e valor da conta atualizado!");
    res.redirect(`/admin/detalhar_conta/${contaId}`);

  } catch (error) {
    console.error("Erro ao excluir a despesa:", error);
    req.flash("error_msg", "Ocorreu um erro ao excluir a despesa.");
    res.redirect(`/admin/detalhar_conta/${contaId}`);
  }
});

// Rota para exibir o formulário de adicionar despesa
router.get("/add_despesa/:contaId", eAdmin, async (req, res) => {
  try {
    const contaId = req.params.contaId;
    const conta = await Conta.findById(contaId).lean();

    if (!conta) {
      req.flash("error_msg", "Conta não encontrada.");
      return res.redirect("/admin/listar_contas");
    }

    const tiposDespesa = await TipoDespesa.find({}).lean();

    res.render("admin/add_despesa", { conta, tiposDespesa });
  } catch (error) {
    console.error("Erro ao carregar o formulário de adicionar despesa:", error);
    req.flash("error_msg", "Ocorreu um erro ao carregar o formulário.");
    res.redirect("/admin/listar_contas");
  }
});

// Rota para adicionar uma nova despesa à conta
router.post("/add_despesa/:contaId", eAdmin, async (req, res) => {
  try {
    const contaId = mongoose.Types.ObjectId(req.params.contaId);

    const { valor, competencia, tipodespesa } = req.body; // Removemos 'descricao' do req.body

    const conta = await Conta.findById(contaId);
    if (!conta) {
      req.flash("error_msg", "Conta não encontrada.");
      return res.redirect("/admin/listar_contas");
    }

    // Busca o nome do tipo de despesa no banco de dados
    const tipoDespesa = await TipoDespesa.findById(tipodespesa);
    if (!tipoDespesa) {
      req.flash("error_msg", "Tipo de despesa não encontrado.");
      return res.redirect(`/admin/detalhar_conta/${req.params.contaId}`);
    }

    // Crie a nova despesa na coleção DespesaConta
    const novaDespesa = await DespesaConta.create({
      descricao: tipoDespesa.nome, // Usa o nome do tipo de despesa como descrição
      valor,
      competencia,
      tipodespesa,
      conta: conta.numero,
      morador: conta.morador._id || conta.morador,
    });

    // Atualize o valor total da conta
    conta.valor = (parseFloat(conta.valor) + parseFloat(valor)).toFixed(2);
    await conta.save();

    req.flash("success_msg", "Despesa adicionada com sucesso!");
    res.redirect(`/admin/detalhar_conta/${req.params.contaId}`);

  } catch (error) {
    console.error("Erro ao adicionar a despesa:", error);
    req.flash("error_msg", "Ocorreu um erro ao adicionar a despesa.");

    res.redirect(`/admin/detalhar_conta/${req.params.contaId}`);
  }
});

// Rota para listar tipos de despesas
router.get("/cadastros/listar_tipos_despesas", eAdmin, async (req, res) => {
  try {
    const tiposDespesas = await TipoDespesa.find()
      .lean()
      .sort({ date: "desc" });
    res.render("admin/cadastros/listar_tipos_despesas", { tiposDespesas });
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao listar os tipos de despesas.");
    res.redirect("/admin/cadastros/tipos_despesas");
  }
});

// Rota para carregar a tela de edição de Tipo de Despesa
router.get("/cadastros/editar_tipo_despesa/:id", eAdmin, async (req, res) => {
  try {
    const tipoDespesa = await TipoDespesa.findById(req.params.id).lean();
    const caixinhas = await Caixinha.find().lean();
    if (!tipoDespesa) {
      // ... (tratamento de erro)
    }
    res.render("admin/cadastros/editar_tipo_despesa", { tipoDespesa, caixinhas });
  } catch (error) {
    // ... (tratamento de erro)
  }
});

// Rota para atualizar um tipo de despesa (processa o formulário de edição)
router.post("/cadastros/edicao_tipo_despesa", eAdmin, async (req, res) => {
  try {
    const { id, nome, slug, classificacao, caixinha, caixinhaId } = req.body;
    let tipoDespesa = await TipoDespesa.findById(id);
    if (!tipoDespesa) {
      req.flash("error_msg", "Tipo de despesa não encontrado.");
      return res.redirect("/admin/cadastros/listar_tipos_despesas");
    }

    // Atualizar os campos do tipoDespesa com os valores do formulário
    tipoDespesa.nome = nome;
    tipoDespesa.slug = slug;
    tipoDespesa.classificacao = classificacao;
    tipoDespesa.caixinha = caixinha;

    // Atualizar caixinhaId somente se for necessário
    if (caixinha === "Somar" || caixinha === "Subtrair") {
      tipoDespesa.caixinhaId = caixinhaId;
    } else {
      tipoDespesa.caixinhaId = undefined; // Remove o caixinhaId se caixinha for "Nenhum"
    }

    await tipoDespesa.save();
    req.flash("success_msg", "Tipo de despesa atualizado com sucesso.");
    res.redirect("/admin/cadastros/listar_tipos_despesas");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao atualizar o tipo de despesa.");
    res.redirect("/admin/cadastros/listar_tipos_despesas");
  }
});


// Rota para excluir um tipo de despesa
router.post("/cadastros/excluir_tipo_despesa/:id", eAdmin, async (req, res) => {
  try {
    await TipoDespesa.findByIdAndRemove(req.params.id);
    req.flash("success_msg", "Tipo de despesa excluído com sucesso.");
    res.redirect("/admin/cadastros/listar_tipos_despesas");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao excluir o tipo de despesa.");
    res.redirect("/admin/cadastros/listar_tipos_despesas");
  }
});


// Rota para selecionar os dados para gerar extrato de conta de morador
router.get('/gera_extrato_conta', eAutenticado, async (req, res) => {
  try {
    const moradores = await Morador.find().select('nome').lean();
    res.render('./admin/gera_extrato_conta', { moradores });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro ao carregar dados' });
  }
});


// Rota para gerar efetivamente o extrato do morador (ajustada para 'situacao')
router.post("/gerar_extrato", async (req, res) => {
  try {
    const { morador, dataInicio, dataFim } = req.body;
    // Convertendo as datas do formulário para objetos Date usando moment-timezone
    const inicio = moment.tz(dataInicio, 'America/Sao_Paulo').startOf('day').toDate();
    const fim = moment.tz(dataFim, 'America/Sao_Paulo').endOf('day').toDate();

    // Buscar o morador pelo nome para obter o ID
    const moradorInfo = await Morador.findOne({ nome: morador }).lean();

    if (!moradorInfo) {
      req.flash('error_msg', "Morador não encontrado.");
      return res.redirect('/admin/gera_extrato_conta');
    }

    const contas = await Conta.find({
      morador: moradorInfo._id,
      data: { $gte: inicio, $lte: fim }
    }).lean();

    if (!contas || contas.length === 0) {
      req.flash('error_msg', "Nenhuma conta encontrada para o período selecionado.");
      return res.redirect('/admin/gera_extrato_conta'); // Redireciona para o formulário
    }


    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=extrato_${morador}.pdf`);

    doc.pipe(res);

    // Função para formatar a data
    function formatDate(dateStr) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year.slice(-2)}`;
    }

    const formattedDate1 = formatDate(dataInicio);
    const formattedDate2 = formatDate(dataFim);

    let y = 200;
    let pageHeight = 842; // Altura da página A4 em pontos (72 pontos por polegada)

    // Imprimir o cabeçalho na primeira página AQUI!
    doc.image('public/images/logo.png', 50, 35, { width: 50 });
    doc.font('Helvetica-Bold').fontSize(20).text('CondoSystem', 120, 50);
    doc.font('Helvetica-Bold').fontSize(22).text('EXTRATO', 410, 50);
    doc.moveTo(50, 85).lineTo(550, 85).stroke();

    // Informações do edifício
    doc.fontSize(10);
    doc.font('Helvetica').text('R Manoel Correa, 991', 50, 100)
      .text('Paranaguá, Paraná. CEP 83203-410', 50, 115)
      .text('Telefone (41) 99705-6066', 50, 130);

    // Informações do morador
    doc.font('Helvetica-Bold').text('Morador:', 50, 160)
      .font('Helvetica').text(`${moradorInfo.nome}`, 100, 160)
      .font('Helvetica-Bold').text('Periodo:', 370, 140)
      .font('Helvetica').text(`${formattedDate1} a ${formattedDate2}`, 415, 140)
      .font('Helvetica-Bold').text('Apartamento:', 370, 160)
      .font('Helvetica').text(`${moradorInfo.apto}`, 440, 160);

    for (const conta of contas) {
      // Verificar se há espaço suficiente para a próxima conta na página atual
      // Considerando o espaço do cabeçalho (estimativa de 150 pontos)
      if (y + 100 + 150 > pageHeight) {
        doc.addPage(); // Adicionar uma nova página
        // y = 50; // Reiniciar a posição vertical para o topo da nova página

        // Repetir cabeçalho na nova página 
        doc.image('public/images/logo.png', 50, 35, { width: 50 });
        doc.font('Helvetica-Bold').fontSize(20).text('CondoSystem', 120, 50);
        doc.font('Helvetica-Bold').fontSize(22).text('EXTRATO', 410, 50);
        doc.moveTo(50, 85).lineTo(550, 85).stroke();

        // Informações do edifício
        doc.fontSize(10);
        doc.font('Helvetica').text('R Manoel Correa, 991', 50, 100)
          .text('Paranaguá, Paraná. CEP 83203-410', 50, 115)
          .text('Telefone (41) 99705-6066', 50, 130);

        // Informações do morador
        doc.font('Helvetica-Bold').text('Morador:', 50, 160)
          .font('Helvetica').text(`${moradorInfo.nome}`, 100, 160)
          .font('Helvetica-Bold').text('Periodo:', 370, 140)
          .font('Helvetica').text(`${formattedDate1} a ${formattedDate2}`, 415, 140)
          .font('Helvetica-Bold').text('Apartamento:', 370, 160)
          .font('Helvetica').text(`${moradorInfo.apto}`, 440, 160);

        y = 220; // Reiniciar Y após o cabeçalho na nova página
      }

      doc.font('Helvetica-Bold').text(`Competência: ${conta.competencia}`, 50, y);
      y += 13;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 20;
      doc.font('Helvetica-Bold').text('DESCRIÇÃO', 50, y)
        .text('DATA', 350, y)
        .text('VALOR', 450, y);
      y += 20;

      // Consulta as despesas do morador na collection DespesaConta
      const despesasDoMorador = await DespesaConta.find({
        conta: conta.numero,
        morador: moradorInfo._id,
      }).populate('tipodespesa').lean();

      despesasDoMorador.forEach(despesa => {
        const valor = parseFloat(despesa.valor);
        doc.font('Helvetica').fontSize(10)
          .text(despesa.descricao, 50, y)
          .text(new Date(despesa.date).toLocaleDateString('pt-BR'), 350, y)
          .text(`R$ ${valor.toFixed(2).replace('.', ',')}`, 450, y);
        y += 20;
      });

      y += 20;

      const saldos = await Saldo.find({ conta: conta.numero, morador: moradorInfo._id }).lean();
      const saldoMesAnterior = saldos.find(saldo => saldo.situacao === "Saldo do Mês Anterior");
      if (saldoMesAnterior && saldoMesAnterior.valor != 0) {
        doc.fontSize(10)
        doc.font('Helvetica-Bold').text('Saldo mês anterior:', 329, y)
        doc.font('Helvetica').text(`R$ ${parseFloat(saldoMesAnterior.valor).toFixed(2).replace('.', ',')}`, 449, y);
        y += 15;
      }

      const totalValor = parseFloat(conta.valor);
      doc.font('Helvetica-Bold').text('Total:', 395, y)
        .font('Helvetica').text(`R$ ${isNaN(totalValor) ? '0,00' : totalValor.toFixed(2).replace('.', ',')}`, 450, y);
      y += 15;

      const pagamento = await Pagamento.findOne({ conta: conta.numero, morador: mongoose.Types.ObjectId(moradorInfo._id) }).lean();
      if (pagamento) {
        doc.fontSize(10)
        doc.font('Helvetica-Bold').text('Pagamento:', 365, y)
        doc.font('Helvetica').text(`R$ ${parseFloat(pagamento.valor).toFixed(2).replace('.', ',')}`, 450, y);
        y += 15;
      }

      const saldoProximoMes = saldos.find(saldo => saldo.situacao === "Saldo para Próximo Mês");
      if (saldoProximoMes && saldoProximoMes.valor != 0) {
        doc.fontSize(10)
        doc.font('Helvetica-Bold').text('Saldo próximo mês:', 328, y)
        doc.font('Helvetica').text(`R$ ${parseFloat(saldoProximoMes.valor).toFixed(2).replace('.', ',')}`, 450, y);
        y += 15;
      }
    }

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao gerar o extrato.");
  }
});


// Rota para gerar e exibir a fatura em PDF (ajustada para 'situacao')
router.get("/imprimir_fatura/:id", async (req, res) => {
  try {
    const conta = await Conta.findById(req.params.id).populate('morador').lean();
    if (!conta) {
      req.flash("error_msg", "Conta não encontrada.");
      return res.redirect("/admin/listar_contas");
    }

    const morador = conta.morador;
    if (!morador) {
      req.flash("error_msg", "Morador não encontrado.");
      return res.redirect("/admin/listar_contas");
    }

    // Buscar todas as despesas da conta e populá-las com os tipos de despesa
    const todasDespesas = await Despesa.find({ conta: conta.numero })
      .populate("tipodespesa")
      .lean();

    // Buscar as despesas da conta relacionadas ao morador específico
    const despesasDoMorador = await DespesaConta.find({
      conta: conta.numero,
      morador: morador._id,
    })
      .populate("tipodespesa")
      .lean();


    // Filtrar as despesas para incluir as corretas de acordo com a 'situacao' do morador
    const despesasFiltradas = despesasDoMorador.filter((despesa) => {
      if (morador.situacao === "Inquilino") {
        return despesa.tipodespesa.classificacao === "Ordinaria"; // Apenas ordinárias para inquilinos
      } else if (morador.situacao === "Proprietário") {
        return despesa.tipodespesa.classificacao === "Extraordinaria"; // Apenas extraordinárias para proprietários
      } else if (morador.situacao === "Proprietário Morador") {
        // Incluir apenas despesas que NÃO são "Subtrair" do Caixinha
        return despesa.tipodespesa.caixinha !== "Subtrair";
      }
      return false; // Exclui para outros casos (se houver)
    });

    // Cria um array para armazenar todas as despesas que serão exibidas no PDF
    const despesasDetalhadas = [];

    // Adiciona as despesas filtradas (ordinárias ou extraordinárias, dependendo da situação do morador)
    despesasDetalhadas.push(...despesasFiltradas.map((despesa) => ({
      descricao: despesa.descricao,
      valor: parseFloat(despesa.valor).toFixed(2),
      data: despesa.date,
    })));

    // Filtra as despesas "Subtrair" que NÃO estão em despesasFiltradas
    const despesasSubtrair = todasDespesas.filter(despesa =>
      despesa.tipodespesa.caixinha === "Subtrair" &&
      despesa.tipodespesa.classificacao === "Extraordinaria" &&
      !despesasFiltradas.some(d => d._id.toString() === despesa._id.toString())
    );


    // Adiciona as despesas "Subtrair" do Caixinha (apenas uma vez)
    if (morador.situacao === "Proprietário" || morador.situacao === "Proprietário Morador") {
      despesasSubtrair.forEach((despesa) => {
        const valor = parseFloat(despesa.valor);
        const valorDividido = isNaN(valor) ? 0 : (Math.ceil(valor / 6));

        // Adiciona a despesa "Subtrair" e o "Saldo do Caixinha"
        despesasDetalhadas.push({
          descricao: despesa.descricao,
          valor: valorDividido.toFixed(2),
          data: despesa.date,
        });
        despesasDetalhadas.push({
          descricao: `Saldo do Caixinha - ${despesa.descricao}`,
          valor: (-valorDividido).toFixed(2),
          data: despesa.date,
        });

      });
    }

    // Buscar os valores dos caixinhas
    const caixinhas =
      morador.situacao === "Proprietário" ||
        morador.situacao === "Proprietário Morador"
        ? await Caixinha.find().lean()
        : [];

    const saldos = await Saldo.find({
      conta: conta.numero,
      morador: morador._id,
    }).lean();
    const pagamento = await Pagamento.findOne({
      conta: conta.numero,
      morador: mongoose.Types.ObjectId(morador._id),
    }).lean();

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=fatura_${conta.numero}.pdf`
    );

    doc.pipe(res);

    // Cabeçalho
    doc.image("public/images/logo.png", 50, 35, { width: 50 });
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("CondoSystem", 120, 50);
    doc.font("Helvetica-Bold").fontSize(28).text("FATURA", 420, 50);

    doc.moveTo(50, 85).lineTo(550, 85).stroke();

    // Informações do edifício
    doc.fontSize(10);
    doc
      .font("Helvetica")
      .text("R Manoel Correa, 991", 50, 100)
      .text("Paranaguá, Paraná. CEP 83203-410", 50, 115)
      .text("Telefone (41) 99705-6066", 50, 130);

    // Informações da fatura
    doc.font("Helvetica-Bold").text(`Fatura Nº:`, 370, 100);
    doc.font("Helvetica").fontSize(10).text(`${conta.numero}`, 420, 100);

    doc
      .font("Helvetica-Bold")
      .text(`Data doc:`, 370, 130)
      .font("Helvetica")
      .text(
        `${new Date(conta.data).toLocaleDateString("pt-BR")}`,
        420,
        130
      );
    doc
      .font("Helvetica-Bold")
      .text(`Competência:`, 370, 115)
      .font("Helvetica")
      .text(`${conta.competencia}`, 440, 115);
    doc
      .font("Helvetica-Bold")
      .text(`Apartamento:`, 370, 145)
      .font("Helvetica")
      .text(`${morador.apto}`, 440, 145);

    // Informações do condômino
    doc
      .font("Helvetica-Bold")
      .text(`Condômino:`, 50, 160)
      .font("Helvetica")
      .text(`${morador.nome}`, 120, 160)
      .font("Helvetica-Bold")
      .text(`Referente a:`, 50, 175)
      .font("Helvetica")
      .text(`Despesas das áreas de uso comum`, 120, 175);

    doc
      .font("Helvetica-Bold")
      .text(`Situação:`, 370, 175)
      .font("Helvetica")
      .text(`${conta.situacao}`, 420, 175);

    doc.moveTo(50, 200).lineTo(550, 200).stroke();

    // Inicializa y para o próximo uso
    let y = 220;

    // Valores dos caixinhas se o morador não for inquilino
    if (
      morador.situacao === "Proprietário" ||
      morador.situacao === "Proprietário Morador"
    ) {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Caixinhas [Valor Atualizado]:", 50, y);

      y += 20;
      caixinhas.forEach((caixinha) => {
        doc
          .font("Helvetica")
          .fontSize(10)
          .text(caixinha.descricao, 50, y)
          .text(
            `R$ ${caixinha.valor.toFixed(2).replace(".", ",")}`,
            450,
            y
          );
        y += 15;
      });

      // Linha separadora antes das despesas
      y += 15;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 15;
    }

    // Tabela de despesas
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("DESCRIÇÃO", 50, y)
      .font("Helvetica-Bold")
      .text("DATA", 350, y)
      .font("Helvetica-Bold")
      .text("VALOR", 450, y);

    y += 20;
    despesasDetalhadas.forEach((despesa) => {
      const valor = parseFloat(despesa.valor);
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(despesa.descricao, 50, y)
        .text(new Date(despesa.data).toLocaleDateString("pt-BR"), 350, y)
        .text(
          `R$ ${isNaN(valor) ? "0,00" : valor.toFixed(2).replace(".", ",")}`,
          450,
          y
        );
      y += 20;
    });

    // Saldo Mês Anterior (Creditado)
    const saldoMesAnterior = saldos.find(
      (saldo) => saldo.situacao === "Saldo do Mês Anterior"
    );
    if (saldoMesAnterior && parseFloat(saldoMesAnterior.valor) !== 0) {
      y += 20;
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`Saldo mês anterior:`, 325, y)
        .font("Helvetica")
        .text(
          `R$ ${parseFloat(saldoMesAnterior.valor)
            .toFixed(2)
            .replace(".", ",")}`,
          450,
          y
        );
    }

    // Totais
    const totalValor = parseFloat(conta.valor);
    y += 15;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`Total:`, 392, y)
      .font("Helvetica")
      .text(
        `R$ ${isNaN(totalValor) ? "0,00" : totalValor.toFixed(2).replace(".", ",")}`,
        450,
        y
      );

    // Valor do pagamento
    if (pagamento) {
      y += 15;
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`Pagamento:`, 362, y)
        .font("Helvetica")
        .text(
          `R$ ${parseFloat(pagamento.valor).toFixed(2).replace(".", ",")}`,
          450,
          y
        );
    }

    // Saldo Próximo Mês
    const saldoProximoMes = saldos.find(
      (saldo) => saldo.situacao === "Saldo para Próximo Mês"
    );
    if (saldoProximoMes && parseFloat(saldoProximoMes.valor) !== 0) {
      y += 15;
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`Saldo próximo mês:`, 324, y)
        .font("Helvetica")
        .text(
          `R$ ${parseFloat(saldoProximoMes.valor)
            .toFixed(2)
            .replace(".", ",")}`,
          450,
          y
        );
    }

    // Rodapé
    y += 30;

    doc.end();
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Erro ao gerar a fatura em PDF.");
    res.redirect("/admin/listar_contas");
  }
});


// Rota para listar os registros de Caixinha
router.get("/cadastros/listar_caixinhas", eAutenticado, eAdmin, async (req, res) => {
  try {
    const caixinhas = await Caixinha.find().lean().sort({ data: "desc" });
    res.render("./admin/cadastros/listar_caixinhas", { caixinhas });
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao listar os registros de Caixinha!");
    res.redirect("/admin");
  }
});

// Rota para exibir a página de cadastro de Movimento do Caixinha
router.get("/cadastrar_movimento", eAutenticado, eAdmin, async (req, res) => {
  try {
    // Buscar todos os Caixinhas para exibir no select
    const caixinhas = await Caixinha.find().lean();

    res.render("./admin/cadastrar_movimento", { caixinhas });
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao carregar os dados!");
    res.redirect("/admin");
  }
});

// Rota para processar o formulário de cadastro de Movimento do Caixinha
router.post("/cadastrar_movimento", eAutenticado, eAdmin, async (req, res) => {
  try {
    const { caixinha, data, valor, movimento, descricao } = req.body;

    // Convertendo valor para o formato correto
    const valorConvertido = parseFloat(valor.replace(',', '.'));

    // Cria o movimento do Caixinha
    const novoMovimento = new MovimentoCaixinha({
      caixinha,
      data,
      valor: valorConvertido,
      movimento,
      descricao,
    });

    await novoMovimento.save();

    // Atualiza o saldo do Caixinha
    const caixinhaSelecionado = await Caixinha.findById(caixinha);
    if (!caixinhaSelecionado) {
      throw new Error("Caixinha não encontrado!");
    }

    if (movimento === "Entrada") {
      caixinhaSelecionado.valor += valorConvertido;
    } else if (movimento === "Saida") {
      caixinhaSelecionado.valor -= valorConvertido;
    }

    await caixinhaSelecionado.save();

    req.flash("success_msg", "Movimento do Caixinha cadastrado com sucesso!");
    res.redirect("/admin/listar_movimentos");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao cadastrar o Movimento!");
    res.redirect("/admin/cadastrar_movimento");
  }
});


// Rota para listar os Movimentos do Caixinha
router.get("/listar_movimentos", eAutenticado, eAdmin, async (req, res) => {
  try {
    const movimentos = await MovimentoCaixinha.find().lean().sort({ data: "desc" });
    res.render("./admin/listar_movimentos", { movimentos });
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao listar os Movimentos!");
    res.redirect("/admin");
  }
});

// Rota para processar a edição do Caixinha
router.post("/cadastros/editar_caixinha/:id", eAutenticado, eAdmin, async (req, res) => {
  try {
    const { data, descricao } = req.body;

    // Atualizar o registro no banco de dados
    await Caixinha.findByIdAndUpdate(req.params.id, {
      data: moment(data, 'YYYY-MM-DD').toDate(), // Converte a data para o formato ISO
      descricao
    });

    req.flash("success_msg", "Caixinha atualizado com sucesso!");
    res.redirect("/admin/cadastros/listar_caixinhas");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao atualizar o Caixinha!");
    res.redirect(`/admin/cadastros/editar_caixinha/${req.params.id}`);
  }
});


// Rota para exibir o formulário de edição do Caixinha
router.get("/cadastros/editar_caixinha/:id", eAutenticado, eAdmin, async (req, res) => {
  try {
    const caixinha = await Caixinha.findById(req.params.id).lean();
    if (!caixinha) {
      req.flash("error_msg", "Caixinha não encontrado.");
      return res.redirect("/admin/cadastros/listar_caixinhas");
    }

    // Ajustar a data para o fuso horário local
    caixinha.data = moment(caixinha.data).tz('America/Sao_Paulo').format('YYYY-MM-DD');

    res.render("./admin/cadastros/editar_caixinha", { caixinha });
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao carregar o formulário de edição do Caixinha!");
    res.redirect("/admin/cadastros/listar_caixinhas");
  }
});

// Rota para excluir o Caixinha
router.post("/cadastros/excluir_caixinha/:id", eAutenticado, eAdmin, async (req, res) => {
  try {
    await Caixinha.findByIdAndDelete(req.params.id);
    req.flash("success_msg", "Caixinha excluído com sucesso!");
    res.redirect("/admin/cadastros/listar_caixinhas");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao excluir o Caixinha!");
    res.redirect("/admin/cadastros/listar_caixinhas");
  }
});

// Rota para exibir a página de cadastro do Caixinha
router.get("/cadastros/cadastrar_caixinha", eAutenticado, eAdmin, (req, res) => {
  res.render("./admin/cadastros/cadastrar_caixinha");
});

// Rota para processar o formulário de cadastro do Caixinha
router.post("/cadastrar_caixinha", eAutenticado, eAdmin, async (req, res) => {
  try {
    const { data, valor, descricao } = req.body;

    // Ajustando a data para o formato correto e fuso horário local
    const dataConvertida = moment.tz(data, 'YYYY-MM-DD', 'America/Sao_Paulo').toDate();

    // Convertendo valor para o formato correto
    const valorConvertido = parseFloat(valor.replace(',', '.'));

    const novoCaixinha = new Caixinha({
      data: dataConvertida,
      valor: valorConvertido,
      descricao,
    });

    await novoCaixinha.save();

    req.flash("success_msg", "Caixinha cadastrado com sucesso!");
    res.redirect("/admin/cadastros/listar_caixinhas"); // Redireciona para a listagem de Caixinhas
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao cadastrar o Caixinha!");
    res.redirect("/admin/cadastros/cadastrar_caixinha");
  }
});

// Rota para listar pagamentos
router.get("/listar_pagamentos", eAdmin, async (req, res) => {
  try {
    const pagamentos = await Pagamento.find()
      .populate('morador') // "Morador" com M maiúsculo
      .lean()
      .sort({ data: "desc" });
    res.render("admin/listar_pagamentos", { pagamentos });
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao listar os pagamentos.");
    res.redirect("/admin");
  }
});

// Rota para excluir um pagamento
router.get("/excluir_pagamento/:id", eAdmin, async (req, res) => {
  try {
    await Pagamento.findByIdAndDelete(req.params.id);
    req.flash("success_msg", "Pagamento excluído com sucesso!");
    res.redirect("/admin/listar_pagamentos");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao excluir o pagamento.");
    res.redirect("/admin/listar_pagamentos");
  }
});

// Rota para listar saldos
router.get("/listar_saldos", eAdmin, async (req, res) => {
  try {
    const saldos = await Saldo.find().lean().sort({ date: "desc" });
    res.render("admin/listar_saldos", { saldos });
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao listar os saldos.");
    res.redirect("/admin");
  }
});

// Rota para excluir um saldo
router.get("/excluir_saldo/:id", eAdmin, async (req, res) => {
  try {
    await Saldo.findByIdAndDelete(req.params.id);
    req.flash("success_msg", "Saldo excluído com sucesso!");
    res.redirect("/admin/listar_saldos");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao excluir o saldo.");
    res.redirect("/admin/listar_saldos");
  }
});

// Rota para excluir um movimento do caixinha
router.get("/excluir_movimento/:id", eAdmin, async (req, res) => {
  try {
    const movimentoId = req.params.id;
    const movimento = await MovimentoCaixinha.findById(movimentoId);

    if (!movimento) {
      req.flash("error_msg", "Movimento não encontrado.");
      return res.redirect("/admin/listar_movimentos");
    }

    // Atualiza o saldo do Caixinha antes de excluir o movimento
    const caixinha = await Caixinha.findById(movimento.caixinha); // Busca o Caixinha usando o ID armazenado no movimento
    if (!caixinha) {
      req.flash("error_msg", "Caixinha não encontrado.");
      return res.redirect("/admin/listar_movimentos");
    }

    if (movimento.movimento === "Entrada") {
      caixinha.valor -= movimento.valor;
    } else if (movimento.movimento === "Saida") {
      caixinha.valor += movimento.valor;
    }
    await caixinha.save();

    // Exclui o movimento
    await MovimentoCaixinha.findByIdAndDelete(movimentoId);

    req.flash("success_msg", "Movimento excluído com sucesso!");
    res.redirect("/admin/listar_movimentos");
  } catch (error) {
    console.error("Erro ao excluir movimento:", error);
    req.flash("error_msg", "Ocorreu um erro ao excluir o movimento.");
    res.redirect("/admin/listar_movimentos");
  }
});


module.exports = router;
