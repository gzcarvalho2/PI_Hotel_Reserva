// src/routes/reserva.routes.js
const ReservaController = require('../controllers/reserva.controller');

// Exportamos uma função que recebe o 'server' do Restify e regista as rotas
module.exports = (server) => {
    server.get("/reserva", ReservaController.listar); 
    server.post("/reserva", ReservaController.criar); 
    server.get("/reserva/:id", ReservaController.buscarPorId); 
    server.put("/reserva/:id", ReservaController.atualizar); 
    server.del("/reserva/:id", ReservaController.deletar);
};