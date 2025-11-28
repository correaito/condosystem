const mongoose = require('mongoose');
require('./models/Usuario');
const Usuario = mongoose.model('Usuario');

mongoose.connect('mongodb://localhost/condominioapp')
    .then(async () => {
        console.log('Conectando ao MongoDB...');
        try {
            const result = await Usuario.updateMany({}, { $set: { eAdmin: 1 } });
            console.log(`Atualizados ${result.modifiedCount} usuários para Administrador.`);
            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
