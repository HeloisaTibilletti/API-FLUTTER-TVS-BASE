import { Model, DataTypes } from "sequelize";
import { sequelize } from "../instances/mysql";

export interface FuncionarioInstance extends Model {
    id: number;
    nome: string;
    funcao: string;
  }

  export const Funcionario = sequelize.define<FuncionarioInstance>(
    "Funcionario",
    {
      id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
      },
      nome: {
        type: DataTypes.STRING
      },
      funcao: {
        type: DataTypes.STRING,
        unique: true
      }
    },
    {
      tableName: "funcionarios",
      timestamps: false
    }
  );