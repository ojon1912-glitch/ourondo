const db = require("../db");

exports.getAll = () => {
  return db.query("SELECT * FROM todos ORDER BY id DESC");
};

exports.create = (title) => {
  return db.query("INSERT INTO todos (title) VALUES ($1) RETURNING *", [title]);
};

exports.update = (id, title, completed) => {
  return db.query(
    "UPDATE todos SET title=$1, completed=$2 WHERE id=$3 RETURNING *",
    [title, completed, id]
  );
};

exports.remove = (id) => {
  return db.query("DELETE FROM todos WHERE id=$1", [id]);
};
