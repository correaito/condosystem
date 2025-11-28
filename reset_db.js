const mongoose = require('mongoose');

// Importar Models
require('./models/Usuario');
require('./models/Morador');
require('./models/Conta');
require('./models/Despesa');
require('./models/TipoDespesa');
require('./models/Caixinha');
require('./models/Saldo');
require('./models/Pagamento');
require('./models/DespesaConta');

const Usuario = mongoose.model('Usuario');
const Morador = mongoose.model('Morador');
const Conta = mongoose.model('Conta');
const Despesa = mongoose.model('Despesa');
const TipoDespesa = mongoose.model('TipoDespesa');
const Caixinha = mongoose.model('Caixinha');
const Saldo = mongoose.model('Saldo');
const Pagamento = mongoose.model('Pagamento');
const DespesaConta = mongoose.model('DespesaConta');

mongoose.connect('mongodb://localhost/condominioapp')
    .then(async () => {
        console.log('Conectado ao MongoDB...');

        try {
            await Usuario.deleteMany({});
            console.log('Usuarios removidos.');

            await Morador.deleteMany({});
            console.log('Moradores removidos.');

            await Conta.deleteMany({});
            console.log('Contas removidas.');

            await Despesa.deleteMany({});
            console.log('Despesas removidas.');

            await TipoDespesa.deleteMany({});
            console.log('Tipos de Despesa removidos.');

            await Caixinha.deleteMany({});
            console.log('Caixinhas removidas.');

            await Saldo.deleteMany({});
            console.log('Saldos removidos.');

            await Pagamento.deleteMany({});
            console.log('Pagamentos removidos.');

            await DespesaConta.deleteMany({});
            console.log('DespesaContas removidas.');

            console.log('Banco de dados limpo com sucesso!');
            process.exit(0);
        } catch (err) {
            console.error('Erro ao limpar banco de dados:', err);
            process.exit(1);
        }
    })
    .catch((err) => {
        console.error('Erro ao conectar ao MongoDB:', err);
        process.exit(1);
    });
