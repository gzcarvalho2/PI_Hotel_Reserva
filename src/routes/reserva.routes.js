// src/routes/reserva.routes.js
const ReservaController = require('../controllers/reserva.controller');

module.exports = (server) => {
    server.get("/reservas", ReservaController.listar); 
    server.post("/criar", ReservaController.criar); 
    server.get("/reservas/:id", ReservaController.buscarPorId); 
    server.put("/reservas/:id", ReservaController.atualizar); 
    server.del("/reservas/:id", ReservaController.deletar);
};