const Todo = require("../models/todomodel");

exports.getTodos = async (req, res) => {
  const result = await Todo.getAll();
  res.json(result.rows);
};

exports.createTodo = async (req, res) => {
  const { title } = req.body;
  const result = await Todo.create(title);
  res.json(result.rows[0]);
};

exports.updateTodo = async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  const result = await Todo.update(id, title, completed);
  res.json(result.rows[0]);
};

exports.deleteTodo = async (req, res) => {
  const { id } = req.params;
  await Todo.remove(id);
  res.send("삭제 완료");
};
