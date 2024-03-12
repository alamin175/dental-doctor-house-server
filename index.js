const express = require("express");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");

const app = express();

// using middleware
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_password}@cluster0.kflht43.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  const usersCollection = client.db("doc-house").collection("users");
  const doctorsCollection = client.db("doc-house").collection("doctors");
  const serviceCollection = client.db("doc-house").collection("services");
  const appoinmentCollection = client.db("doc-house").collection("appoinment");

  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    app.get("/", (req, res) => {
      res.send("Doc house portal news coming");
    });

    /* User's related api */
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };

      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User Already exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/allUsers", async (req, res) => {
      const user = await usersCollection.find().toArray();
      res.send(user);
    });

    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const deleteUser = await usersCollection.deleteOne(query);
      res.send(deleteUser);
    });
    /*----------------
            END
    -----------------*/

    /* admin related api */
    app.post("/makeAdmin/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const update = await usersCollection.updateOne(filter, updatedDoc);
      res.send(update);
    });
    /*----------------
            END
    -----------------*/

    /* doctor related API */
    app.get("/doctors", async (req, res) => {
      const doctors = await doctorsCollection.find().toArray();
      res.send(doctors);
    });

    app.delete("/doctor/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const deleteDoctor = await doctorsCollection.deleteOne(query);
      res.send(deleteDoctor);
    });

    app.post("/doctor", async (req, res) => {
      const doctor = req.body;
      // console.log(doctor);
      const result = await doctorsCollection.insertOne(doctor);
      res.send(result);
    });

    /*----------------
            END
    -----------------*/

    app.get("/services", async (req, res) => {
      const result = await serviceCollection.find().toArray();
      res.send(result);
    });

    /* Appoinment related API */

    app.post("/appoinment", async (req, res) => {
      const appoinment = req.body;
      const result = await appoinmentCollection.insertOne(appoinment);
      res.send(result);
    });

    app.get("/allAppoinment", async (req, res) => {
      const result = await appoinmentCollection.find().toArray();
      res.send(result);
    });

    app.get("/myAppoinments", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await appoinmentCollection.find(query).toArray();
      res.send(result);
    });
    /*----------------
            END
    -----------------*/
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("listening port is", port);
});
