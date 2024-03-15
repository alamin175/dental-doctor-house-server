const express = require("express");

require("dotenv").config();
var jwt = require("jsonwebtoken");

const app = express();
const cors = require("cors");

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// using middleware
// app.use(cors());
// app.use(cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());

const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
  const expertDoctorsCollection = client
    .db("doc-house")
    .collection("expertDoctors");

  /* MIDDLEWARE */

  const verifyToken = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res
        .status(401)
        .send({ error: true, message: "Unauthorized Access" });
    }

    const token = authorization.split(" ")[1];
    // console.log(token);
    jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .send({ error: true, message: "Forbidden Access" });
      }
      req.decoded = decoded;
      next();
    });
  };

  const verifyAdmin = async (req, res, next) => {
    const email = req.decoded.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    const isAdmin = user.role === "admin";
    if (!isAdmin) {
      res.status(403).send({ message: "Forbidden Access" });
    }
    next();
  };

  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
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

    app.get("/allUsers", verifyToken, verifyAdmin, async (req, res) => {
      const user = await usersCollection.find().toArray();
      res.send(user);
    });

    app.delete("/user/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const deleteUser = await usersCollection.deleteOne(query);
      res.send(deleteUser);
    });
    /*----------------
            END
    -----------------*/

    /* admin related api */
    app.patch(
      "/makeAdmin/:email",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const email = req.params.email;
        const filter = { email: email };
        const updatedDoc = {
          $set: {
            role: "admin",
          },
        };
        const update = await usersCollection.updateOne(filter, updatedDoc);
        res.send(update);
      }
    );

    app.get("/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.send({ admin: false });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    /*----------------
            END
    -----------------*/

    /* doctor related API */
    app.get("/doctors", async (req, res) => {
      const doctors = await doctorsCollection.find().toArray();
      res.send(doctors);
    });

    app.delete("/doctor/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const deleteDoctor = await doctorsCollection.deleteOne(query);
      res.send(deleteDoctor);
    });

    app.post("/doctor", verifyToken, verifyAdmin, async (req, res) => {
      const doctor = req.body;
      // console.log(doctor);
      const result = await doctorsCollection.insertOne(doctor);
      res.send(result);
    });

    app.get("/expertDoctors", async (req, res) => {
      const result = await expertDoctorsCollection.find().toArray();
      res.send(result);
    });

    app.get("/doctorDetails/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await expertDoctorsCollection.findOne(query);
      res.send(result);
    });

    /*----------------
            END
    -----------------*/

    app.get("/services", verifyToken, async (req, res) => {
      const result = await serviceCollection.find().toArray();
      res.send(result);
    });

    /* Appoinment related API */

    app.post("/appoinment", verifyToken, async (req, res) => {
      const appoinment = req.body;
      const result = await appoinmentCollection.insertOne(appoinment);
      res.send(result);
    });

    app.get("/allAppoinment", verifyToken, verifyAdmin, async (req, res) => {
      const result = await appoinmentCollection.find().toArray();
      res.send(result);
    });

    app.get("/myAppoinments", verifyToken, async (req, res) => {
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
