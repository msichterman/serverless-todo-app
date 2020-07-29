import React, { useEffect, useState } from "react";
import Amplify, { API, graphqlOperation } from "aws-amplify";
import { createTodo, updateTodo, deleteTodo } from "./graphql/mutations";
import { listTodos } from "./graphql/queries";
import { withAuthenticator, AmplifySignOut } from "@aws-amplify/ui-react";

import { Auth } from "aws-amplify";

import awsExports from "./aws-exports";
Amplify.configure(awsExports);

const initialState = { name: "", description: "", completed: false };

const App = () => {
  const [formState, setFormState] = useState(initialState);
  const [todos, setTodos] = useState([]);
  const [username, setUsername] = useState("");

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then((user) => setUsername(user.username))
      .catch((err) => console.log(err));
    fetchTodos();
  }, []);

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value });
  }

  async function fetchTodos() {
    try {
      const todoData = await API.graphql(graphqlOperation(listTodos));
      const todos = todoData.data.listTodos.items;
      setTodos(todos);
    } catch (err) {
      console.log("Error fetching todos", err);
    }
  }

  async function addTodo() {
    try {
      if (!formState.name || !formState.description) return;
      const todo = { ...formState };
      setFormState(initialState);
      await API.graphql(graphqlOperation(createTodo, { input: todo }));
      fetchTodos();
    } catch (err) {
      console.log("error creating todo:", err);
    }
  }

  async function updateTodoStatus(todo) {
    try {
      await API.graphql(graphqlOperation(updateTodo, { input: todo }));
    } catch (err) {
      console.log("Error updating todo", err);
    }
  }

  async function toggleTodo(event) {
    if (event.target.id) {
      let todoDetails = {
        id: event.target.id,
        completed: false,
      };

      if (event.target.classList.contains("completed")) {
        updateTodoStatus(todoDetails);
      } else {
        todoDetails.completed = true;
        updateTodoStatus(todoDetails);
      }

      event.target.classList.toggle("completed");
    }
  }

  async function removeTodo(event) {
    let todoDetails = {
      id: event.target.parentElement.id,
    };

    try {
      await API.graphql(graphqlOperation(deleteTodo, { input: todoDetails }));
      fetchTodos();
    } catch (err) {
      console.log("Error deleting todo", err);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <p>
          Welcome <strong>{username}</strong>!
        </p>
        <AmplifySignOut />
      </div>
      <h1 style={styles.heading}>To-Do List</h1>
      <div style={styles.gridContainer}>
        <div style={styles.left}>
          <h2>Create To-Do:</h2>
          <p>
            Boost your productivity with to-dos!{" "}
            <span role="img" aria-label="winkey face">
              😉
            </span>
          </p>
          <input
            onChange={(event) => setInput("name", event.target.value)}
            style={styles.input}
            value={formState.name}
            placeholder="Name"
          />
          <input
            onChange={(event) => setInput("description", event.target.value)}
            style={styles.input}
            value={formState.description}
            placeholder="Description"
          />
          <button style={styles.button} onClick={addTodo}>
            Create To-Do
          </button>
        </div>
        <div>
          <h2>To-Dos:</h2>
          <p>Click to toggle a to-do item, or click 'x' to remove</p>
          {todos
            .sort((a, b) => a.createdAt > b.createdAt)
            .map((todo, index) => (
              <div
                key={todo.id ? todo.id : index}
                id={todo.id ? todo.id : index}
                className={`todo${todo.completed ? " completed" : ""}`}
                style={styles.todo}
                onClick={toggleTodo}
              >
                <div style={styles.remove} onClick={removeTodo}>
                  ✖
                </div>
                <p className="todoName" style={styles.todoName}>
                  {todo.name}
                </p>
                <p className="todoDescription" style={styles.todoDescription}>
                  {todo.description}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 800,
    margin: "0 auto",
    display: "flex",
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    padding: 20,
  },
  navbar: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  heading: {
    textAlign: "center",
    paddingBottom: 30,
    borderBottom: "1px solid #333",
  },
  gridContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  left: {
    display: "flex",
    flexDirection: "column",
    minWidth: 300,
    marginRight: 30,
  },
  todo: {
    marginBottom: 15,
    backgroundColor: "#d9f2fe",
    color: "#333",
    padding: 20,
    borderRadius: 12,
    maxWidth: 400,
    position: "relative",
  },
  remove: {
    padding: "5px 7px",
    position: "absolute",
    top: 10,
    right: 10,
    color: "white",
    border: "3px solid red",
    borderRadius: 12,
    fontWeight: "bold",
    backgroundColor: "red",
  },
  input: {
    border: "none",
    backgroundColor: "#eee",
    marginBottom: 10,
    padding: 8,
    fontSize: 18,
  },
  todoName: { fontSize: 20, fontWeight: "bold", marginTop: 0 },
  todoDescription: { marginBottom: 0 },
  button: {
    backgroundColor: "#333",
    color: "white",
    outline: "none",
    fontSize: 18,
    padding: "12px 0px",
    cursor: "pointer",
  },
};

export default withAuthenticator(App);
