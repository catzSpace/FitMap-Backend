const express = require("express");
const { db } = require("./src/dbConection");
const cors = require("cors");
const app = express();


app.use(express.json());
app.use(cors());

// create
app.post("/api/users/create", async (req, res) => {
});

// read
app.get("/api/users", async (req, res) => {
});

// update
app.put("/api/users/:id", async (req, res) => {
  
});

app.listen(5111, () => {
  console.log("Servidor corriendo en http://localhost:5111");
});
