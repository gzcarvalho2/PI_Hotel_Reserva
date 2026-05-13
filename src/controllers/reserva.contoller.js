const prisma = require("../config/prisma"); 
 
class ReservaController { 
  static async listar(req, res) { 
    try { 
      const reserva = await prisma.reserva.findMany({ 
        orderBy: { id: "asc" } 
      }); 
 
      res.send(200, reserva); 
    } catch (error) { 
      res.send(500, { message: "Erro ao listar reservas." }); 
    } 
  } 
 
  static async criar(req, res) { 
    try { 
      const {reserva_id} = req.body; 
 
      if (!reserva_id) { 
        res.send(400, { 
          message: "O id da reserva é obrigatório" 
        }); 
      } 
      const novaReserva = await prisma.reserva.create({ 
        data: {reserva_id} 
      }); 
 
      res.send(201, novaReserva); 
    } catch (error) { 
      if (error.code === "P2002") { 
        res.send(409, { message: "Já existe uma reserva com esse id." }); 
      } 
 
      res.send(500, { message: "Erro ao cadastrar reserva." }); 
    } 
  }
} 
 
module.exports = UsuariosController; 