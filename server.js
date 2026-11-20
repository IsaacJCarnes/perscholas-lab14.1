//Configure our .env file
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import User from "./models/User.js";
import jwt from "jsonwebtoken";

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

const secret = process.env.JWT_SECRET;
const expiration = "2h";

// and connect to our database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB!");
  })
  .catch((error) => {
    console.log("Not connected to Database");
    console.error(error);
  });

app.get("/", (req, res) => {
  res.send("Welcome to our Authentication API!");
});

app.post("/api/users/register", async (req, res) => {
  try {
    const user = await User.create(req.body);
    const payload = {
      _id: user._id,
      username: user.username,
      email: user.email,
    };
    res.status(201).json(payload);
  } catch (err) {
    //11000 is the error code for duplicate keys
    if (err.code === 11000) {
      return res.status(400).send("Username or email is already in use");
    }
    res.status(500).send("Something went wrong: " + err.message);
  }
});

// Generating a token with our login route
app.post("/api/users/login", async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      throw new Error("Incomplete Data from request.");
    }
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(400).json({ message: "Incorrect email or password" });
    }

    const correctPw = await user.isCorrectPassword(req.body.password);

    if (!correctPw) {
      return res.status(400).json({ message: "Incorrect email or password" });
    }

    const payload = {
      _id: user._id,
      username: user.username,
      email: user.email,
    };

    const token = jwt.sign({ data: payload }, secret, {
      expiresIn: expiration,
    });

    res.json({ token, user: payload });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});
