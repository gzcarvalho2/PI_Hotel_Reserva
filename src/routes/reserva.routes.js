// src/routes/reserva.routes.js
const ReservaController = require('../controllers/reserva.controller');

// O prefixo base exigido pelo servidor da faculdade
const BASE_PATH = "/20261prj5/hotel/reserva";

// Exportamos uma função que recebe o 'server' do Restify e regista as rotas
module.exports = (server) => {
    server.get(`${BASE_PATH}`, ReservaController.listar); 
    server.post(`${BASE_PATH}`, ReservaController.criar); 
    server.get(`${BASE_PATH}/:id`, ReservaController.buscarPorId); 
    server.put(`${BASE_PATH}/:id`, ReservaController.atualizar); 
    server.del(`${BASE_PATH}/:id`, ReservaController.deletar);
};