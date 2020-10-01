import express from "express";
import * as bodyParser from "body-parser";

const app = express();

// Middleware
app.use(bodyParser.json());

// Root
app.get("/", (req, res) => res.send("Hello World!"));

export default app;
