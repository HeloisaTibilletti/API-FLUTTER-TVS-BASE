import { Request, Response } from "express";
import { Produto } from "../models/Produto";
import { Cliente } from "../models/Cliente";
import { Pedido } from "../models/Pedido";
import { ItemDoPedido } from "../models/ItemDoPedido";
const request = require("supertest");
import { app } from "../server"; 

// Listar todos os pedidos e retornar objetos separados para pedido e cliente
export const listarPedidos = async (req: Request, res: Response) => {
  try {
    const pedidos = await Pedido.findAll({
      include: [
        {
          model: Cliente,
          as: "Cliente" // Use o alias correto aqui
        }
      ]
    });

    // Formata a resposta para separar os objetos de pedido e cliente
    const pedidosFormatados = pedidos.map((pedido) => ({
      pedido: {
        id: pedido.id, // Inclui o id do pedido
        data: pedido.data // Inclui a data do pedido
      },
      cliente: pedido.Cliente
        ? {
            id: pedido.Cliente.id,
            nome: pedido.Cliente.nome,
            sobrenome: pedido.Cliente.sobrenome,
            cpf: pedido.Cliente.cpf
          }
        : null
    }));

    res.json({ pedidos: pedidosFormatados });
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);
    res.status(500).json({ message: "Erro ao listar pedidos" });
  }
};

// Buscar pedido por ID e retornar objetos separados para pedido e cliente
export const getPedidoById = async (req: Request, res: Response) => {
  try {
    const pedidoId = parseInt(req.params.idPedido, 10);
    const pedido = await Pedido.findByPk(pedidoId, {
      include: [
        {
          model: Cliente,
          as: "Cliente" // Use o alias correto aqui
        }
      ]
    });

    if (pedido) {
      const response = {
        pedido: {
          id: pedido.id,
          data: pedido.data
        },
        cliente: pedido.Cliente
          ? {
              id: pedido.Cliente.id,
              nome: pedido.Cliente.nome,
              sobrenome: pedido.Cliente.sobrenome,
              cpf: pedido.Cliente.cpf
            }
          : null
      };

      res.json(response);
    } else {
      res.status(404).json({ message: "Pedido não encontrado" });
    }
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    res.status(500).json({ message: "Erro ao buscar pedido" });
  }
};

// Incluir um novo pedido
export const incluirPedido = async (req: Request, res: Response) => {
  try {
    const { data, id_cliente } = req.body;
    const novoPedido = await Pedido.create({ data, id_cliente });

    res.status(201).json(novoPedido);
  } catch (error) {
    console.error("Erro ao incluir pedido:", error);
    res.status(500).json({ message: "Erro ao incluir pedido" });
  }
};

// Atualizar um pedido existente
export const atualizarPedido = async (req: Request, res: Response) => {
  try {
    const pedidoId = parseInt(req.params.id, 10);
    const { data, id_cliente } = req.body;

    const pedido = await Pedido.findByPk(pedidoId);

    if (pedido) {
      await pedido.update({ data, id_cliente });
      res.json(pedido);
    } else {
      res.status(404).json({ message: "Pedido não encontrado" });
    }
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    res.status(500).json({ message: "Erro ao atualizar pedido" });
  }
};

// Excluir um pedido existente
export const excluirPedido = async (req: Request, res: Response) => {
  try {
    const pedidoId = parseInt(req.params.id, 10);
    const pedido = await Pedido.findByPk(pedidoId);

    if (pedido) {
      await pedido.destroy();
      res.json({ message: "Pedido excluído com sucesso" });
    } else {
      res.status(404).json({ message: "Pedido não encontrado" });
    }
  } catch (error) {
    console.error("Erro ao excluir pedido:", error);
    res.status(500).json({ message: "Erro ao excluir pedido" });
  }
};


describe("Teste de Integração Cliente e Pedido", () => {
  let clienteId: number;
  let pedidoId: number;

  // Cria um cliente e um pedido para o teste
  beforeAll(async () => {
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

  it("Deve criar um pedido para um cliente e associar corretamente", async () => {
    const novoPedido = {
      data: "2024-08-02",
      id_cliente: clienteId
    };
  
    const response = await request(app).post("/incluirPedido").send(novoPedido);
  
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.id_cliente).toBe(novoPedido.id_cliente);
  
    const pedidoCriado = await Pedido.findByPk(response.body.id);
    expect(pedidoCriado).not.toBeNull();
  
    if (pedidoCriado) {
      expect(pedidoCriado.id_cliente).toBe(clienteId);
    }
  });

  it("Deve recuperar um cliente e verificar se os pedidos associados são retornados corretamente", async () => {
    const response = await request(app).get(`/clientes/${clienteId}/pedidos`);
  
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("pedidos");
    expect(response.body.pedidos).toBeInstanceOf(Array);
    expect(response.body.pedidos.length).toBeGreaterThan(0);
  
    const pedidoAssociado = response.body.pedidos.find((p: any) => p.id === pedidoId);
    
    // Verifica se o pedido foi encontrado
    expect(pedidoAssociado).not.toBeUndefined();
  
    // Apenas acessa a propriedade id_cliente se o pedido foi encontrado
    if (pedidoAssociado) {
      expect(pedidoAssociado.id_cliente).toBe(clienteId);
    }
  });
  
  // Limpeza após os testes
  afterAll(async () => {
    if (pedidoId) {
      await Pedido.destroy({ where: { id: pedidoId } });
    }
    if (clienteId) {
      await Cliente.destroy({ where: { id: clienteId } });
    }
  });
});


describe("Teste de Integridade Relacional: Exclusão de Produto com Itens de Pedido Associados", () => {
  let produtoId: number;
  let itemPedidoId: number;

  beforeAll(async () => {
    // Cria um produto e um pedido para o item
    const produto = await Produto.create({
      nome: "Produto Teste",
      preco: 100
    });
    produtoId = produto.id;

    // Verifica se o pedido com ID 1 existe
    const pedidoExistente = await Pedido.findByPk(1);
    if (!pedidoExistente) {
      throw new Error('Pedido com id 1 não encontrado');
    }

    // Cria um item de pedido associado
    const itemPedido = await ItemDoPedido.create({
      id_produto: produtoId,
      quantidade: 2,
      id_pedido: 1
    });
    itemPedidoId = itemPedido.id;
  });

  it("Deve falhar ao tentar excluir um produto com itens de pedidos associados", async () => {
    const response = await request(app).delete(`/produtos/${produtoId}`);

    expect(response.status).toBe(400); // Ou o status que você espera para a falha
    expect(response.body).toHaveProperty("message", "Produto possui itens de pedidos associados e não pode ser excluído");

    // Verifica se o produto ainda está presente
    const produto = await Produto.findByPk(produtoId);
    expect(produto).not.toBeNull();

    // Verifica se o item de pedido ainda está presente
    const itemPedido = await ItemDoPedido.findByPk(itemPedidoId);
    expect(itemPedido).not.toBeNull();
  });

  afterAll(async () => {
    // Limpeza após os testes
    await ItemDoPedido.destroy({ where: { id: itemPedidoId } });
    await Produto.destroy({ where: { id: produtoId } });
  });
});
