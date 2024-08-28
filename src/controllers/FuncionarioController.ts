import { Request, Response } from "express";
import { Funcionario } from "../models/Funcionario";
import { Op } from "sequelize";

export const listarFuncionarios = async (req: Request, res: Response) => {
  try {
    const funcionarios = await Funcionario.findAll();
    res.json({ funcionarios });
  } catch (error) {
    console.error("Erro ao listar Funcionários:", error);
    res.status(500).json({ message: "Erro ao listar Funcionários" });
  }
};


export const incluirFuncionario = async (req: Request, res: Response) => {
    try {
      const { nome, funcao } = req.body;

      const funcionarioExistente = await Funcionario.findOne({ where: { nome } });
  
      if (funcionarioExistente) {
        return res.status(400).json({ message: "Funcionario já cadastrado" });
      }

      const novoFuncionario = await Funcionario.create({ nome, funcao });
  
      res.status(201).json(novoFuncionario);
    } catch (error) {
      console.error("Erro ao incluir Funcionario:", error);
      res.status(500).json({ message: "Erro ao incluir Funcionario" });
    }
  };
  

export const getFuncionarioById = async (req: Request, res: Response) => {
  try {
    const funcionarioId = parseInt(req.params.idFuncionario, 10);
    const funcionario = await Funcionario.findByPk(funcionarioId);

    if (funcionario) {
      res.json(funcionario);
    } else {
      res.status(404).json({ message: "Funcionario não encontrado" });
    }
  } catch (error) {
    console.error("Erro ao buscar Funcionario:", error);
    res.status(500).json({ message: "Erro ao buscar Funcionario" });
  }
};

export const atualizarFuncionario = async (req: Request, res: Response) => {
    try {
      const funcionarioId = parseInt(req.params.idFuncionario, 10);
      const { nome, funcao } = req.body;
  
      // Verificar se o nome já está sendo usado por outro Funcionario
      const nomeExistente = await Funcionario.findOne({
        where: {
          nome,
          id: {
            [Op.not]: funcionarioId, 
          },
        },
      });
  
      if (nomeExistente) {
        res.status(400).json({ message: "Nome já está sendo usado por outro funcionário" });
        return;
      }
  
      const funcionario = await Funcionario.findByPk(funcionarioId);
  
      if (funcionario) {
        await funcionario.update({ nome, funcao });
        res.json(funcionario);
      } else {
        res.status(404).json({ message: "Funcionario não encontrado" });
      }
    } catch (error) {
      console.error("Erro ao atualizar Funcionario:", error);
      res.status(500).json({ message: "Erro ao atualizar funcionario" });
    }
  };


export const excluirFuncionario = async (req: Request, res: Response) => {
    try {
      const funcionarioId = parseInt(req.params.idFuncionario, 10);
  
      // Verifica se o cliente existe
      const funcionario = await Funcionario.findByPk(funcionarioId);
      if (!funcionario) {
        return res.status(404).json({ message: "Funcionario não encontrado" });
      }

      await funcionario.destroy();
      res.json({ message: "Funcionario excluído com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir Funcionário:", error);
      res.status(500).json({ message: "Erro ao excluir Funcionario" });
    }
  };

  


  




