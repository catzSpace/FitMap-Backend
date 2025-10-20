require("dotenv").config();
const express = require("express");
const { db } = require("./src/dbConnection");
const cors = require("cors");

const userRoutes = require("./src/routes/users");
const eventRoutes = require("./src/routes/events");

//Commit de dani

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);

/*
// read
app.get("/api/users", async (req, res) => {
});


// update
app.put("/api/users/:id", async (req, res) => {
  
});*/

app.listen(5111, () => {
  console.log("Servidor corriendo en http://localhost:5111");
});
