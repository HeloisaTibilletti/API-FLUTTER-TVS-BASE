import { Request, Response } from "express";
import { Produto } from "../models/Produto";
import { Cliente } from "../models/Cliente";
import { Pedido } from "../models/Pedido";
import { Op } from "sequelize";

const request = require("supertest");
import { app } from "../server"; 

export const listarClientes = async (req: Request, res: Response) => {
  try {
    const clientes = await Cliente.findAll();

    if (clientes.length > 0) {
      res.json(clientes); //
    } else {
      res.status(404).json({ message: "Nenhum cliente cadastrado!" });
    }

  } catch (error) {
    console.error("Erro ao listar clientes:", error);
    res.status(500).json({ message: "Erro ao listar clientes" });
  }
};

export const getClienteById = async (req: Request, res: Response) => {
  try {
    const clienteId = parseInt(req.params.idCliente, 10); // Obter o ID do cliente a partir dos parâmetros da solicitação
    const cliente = await Cliente.findByPk(clienteId);

    if (cliente) {
      res.json(cliente); // Cliente encontrado, retorne-o como resposta
    } else {
      res.status(404).json({ message: "Cliente não encontrado" }); // Cliente não encontrado
    }
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    res.status(500).json({ message: "Erro ao buscar cliente" });
  }
};

export const excluirCliente = async (req: Request, res: Response) => {
  try {
    const clienteId = parseInt(req.params.idCliente, 10);

    // Verifica se o cliente existe
    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente não encontrado" });
    }

    // Verifica se o cliente possui pedidos vinculados
    const pedidosDoCliente = await Pedido.findAll({ where: { id_cliente: clienteId } });
    if (pedidosDoCliente.length > 0) {
      return res.status(400).json({ message: "Não é possível excluir o cliente, pois há pedidos vinculados a ele." });
    }

    // Se não houver pedidos vinculados, procede com a exclusão
    await cliente.destroy();
    res.json({ message: "Cliente excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    res.status(500).json({ message: "Erro ao excluir cliente" });
  }
};

export const atualizarCliente = async (req: Request, res: Response) => {
  try {
    const clienteId = parseInt(req.params.idCliente, 10);
    const { nome, sobrenome, cpf } = req.body;

    // Verificar se o CPF já está sendo usado por outro cliente
    const cpfExistente = await Cliente.findOne({
      where: {
        cpf,
        id: {
          [Op.not]: clienteId, // Garante que não estamos comparando com o mesmo cliente
        },
      },
    });

    if (cpfExistente) {
      res.status(400).json({ message: "CPF já está sendo usado por outro cliente" });
      return;
    }

    const cliente = await Cliente.findByPk(clienteId);

    if (cliente) {
      await cliente.update({ nome, sobrenome, cpf });
      res.json(cliente);
    } else {
      res.status(404).json({ message: "Cliente não encontrado" });
    }
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    res.status(500).json({ message: "Erro ao atualizar cliente" });
  }
};

export const incluirCliente = async (req: Request, res: Response) => {
  try {
    const { nome, sobrenome, cpf } = req.body;

    // Verifica se o CPF já existe no banco de dados
    const clienteExistente = await Cliente.findOne({ where: { cpf } });

    if (clienteExistente) {
      return res.status(400).json({ message: "CPF já cadastrado" });
    }

    // Se o CPF não existir, cria um novo cliente
    const novoCliente = await Cliente.create({ nome, sobrenome, cpf });

    res.status(201).json(novoCliente);
  } catch (error) {
    console.error("Erro ao incluir cliente:", error);
    res.status(500).json({ message: "Erro ao incluir cliente" });
  }
};

  describe("Teste de Integridade Relacional: Exclusão de Cliente com Pedidos Associados", () => {
    let clienteId: number;
    let pedidoId: number;

    beforeAll(async () => {
      // Cria um cliente e um pedido associado
      const cliente = await Cliente.create({
        nome: "Cliente Teste",
        sobrenome: "Sobrenome Teste",
        cpf: "12345678900"
      });
      clienteId = cliente.id;

      const pedido = await Pedido.create({
        data: "2024-08-01",
        id_cliente: clienteId
      });
      pedidoId = pedido.id;
    });

    it("Deve falhar ao tentar excluir um cliente com pedidos associados", async () => {
      const response = await request(app).delete(`/clientes/${clienteId}`);

      expect(response.status).toBe(400); // Ou o status que você espera para a falha
      expect(response.body).toHaveProperty("message", "Cliente possui pedidos associados e não pode ser excluído");

      // Verifica se o cliente ainda está presente
      const cliente = await Cliente.findByPk(clienteId);
      expect(cliente).not.toBeNull();

      // Verifica se o pedido ainda está presente
      const pedido = await Pedido.findByPk(pedidoId);
      expect(pedido).not.toBeNull();
    });

    afterAll(async () => {
      // Limpeza após os testes
      await Pedido.destroy({ where: { id: pedidoId } });
      await Cliente.destroy({ where: { id: clienteId } });
    });
  });

