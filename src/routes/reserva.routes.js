// src/routes/reserva.routes.js
const ReservaController = require('../controllers/reserva.controller');
const auth = require('../middlewares/auth');

module.exports = (server) => {
    server.get("/reservas", auth, ReservaController.listar);
    server.post("/criar", auth, ReservaController.criar);
    server.get("/reservas/:id", auth, ReservaController.buscarPorId);
    server.put("/reservas/:id", auth, ReservaController.atualizar);
    server.del("/reservas/:id", auth, ReservaController.deletar);
};
