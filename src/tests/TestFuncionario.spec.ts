const request = require("supertest");
import { app } from "../server"; 
import { Funcionario } from "../models/Funcionario";

describe("Teste da Rota incluirFuncionario", () => {
  let funcionarioId: number;

  it("Deve incluir um novo Funcionario com sucesso", async () => {
    const novoFuncionario = {
      nome: "Novo",
      funcao: "Funcionario",
    };

    const response = await request(app).post("/incluirFuncionario").send(novoFuncionario);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.nome).toBe(novoFuncionario.nome);
    expect(response.body.funcao).toBe(novoFuncionario.funcao);

    funcionarioId = response.body.id;

  it("Deve retornar erro ao tentar incluir um Funcionario com nome já existente", async () => {
    const funcionarioExistente = {
      nome: "Existente",
      funcao: "Funcionario",
    };


    const response = await request(app).post("/incluirFuncionario").send(funcionarioExistente);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Nome já cadastrado");
  });

  afterAll(async () => {
    // Remove o Funcionario criado no teste
    if (funcionarioId) {
      await Funcionario.destroy({ where: { id: funcionarioId } });
    }
    }); 
  });
});

describe("Teste da Rota GetFuncionarioById", () => {
  it("Deve retornar o Funcionario correto quando o id é valido", async () => {
    const idFuncionario = 1;
    const response = await request(app).get(`/funcionarios/${idFuncionario}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", idFuncionario);
  });
});

describe("Teste da Rota listarFuncionarios", () => {
  it("Deve retornar uma lista de Funcionarios", async () => {
    const response = await request(app).get("/funcionarios");

    expect(response.status).toBe(200);
    expect(response.body.funcionarios).toBeInstanceOf(Array);
  });

  it("Deve retornar a lista de Funcionario dentro de um tempo aceitável", async () => {
    const start = Date.now();
    const response = await request(app).get("/funcionarios");
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(100);
  });
});

describe("Teste da Rota excluirFuncionario", () => {
  let funcionarioId: number;

  beforeAll(async () => {
    const funcionario = await Funcionario.create({ nome: "Funcionario Teste", funcao: "Teste" });
    funcionarioId = funcionario.id; // ID dinâmico
  });

  afterAll(async () => {
    // Limpa o banco de dados após os testes
    if (funcionarioId) {
      await Funcionario.destroy({ where: { id: funcionarioId } });
    }
  });

  it("Deve excluir um Funcionario existente", async () => {
    const response = await request(app).delete(`/excluirFuncionario/${funcionarioId}`);

    // Verifica se a resposta da API está correta
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Funcionario excluído com sucesso");

    const funcionarioExcluido = await Funcionario.findByPk(funcionarioId);
    expect(funcionarioExcluido).toBeNull();
  });
});

describe("Teste da Rota atualizarFuncionario", () => {
  let funcionarioId: number;

  beforeAll(async () => {
    const funcionario = await Funcionario.create({
      nome: "Funcionario para Atualizar",
      funcao: "Função"
    });
    funcionarioId = funcionario.id;
  });

  it("Deve atualizar um Funcionario com sucesso", async () => {
    const funcionarioAtualizado = {
      nome: "Funcionario Atualizado",
      funcao: "Função Atualizado"
    };

    const response = await request(app).put(`/atualizarFuncionario/${funcionarioId}`).send(funcionarioAtualizado);

    expect(response.status).toBe(200);
    expect(response.body.nome).toBe(funcionarioAtualizado.nome);
    expect(response.body.funcao).toBe(funcionarioAtualizado.funcao);
  });

  it("Deve retornar erro ao tentar atualizar Funcionario inexistente", async () => {
    const funcionarioInexistenteId = 999999;
    const funcionarioAtualizado = {
      nome: "Funcionario Inexistente"
    };

    const response = await request(app).put(`/atualizarFuncionario/${funcionarioInexistenteId}`).send(funcionarioAtualizado);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Funcionario não encontrado");
  });

  afterAll(async () => {
    await Funcionario.destroy({ where: { id: funcionarioId } });
  });
});
