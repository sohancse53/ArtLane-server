const express = require("express");
const cors = require("cors");
require("dotenv").config();
var admin = require("firebase-admin");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Connected");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hjbjloq.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const serviceAccount = require("./firebase_auth_key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// const verifyFirebaseToken = async(req,res,next)=>{
//   const authorization = req.headers.authorization;
//   if(!authorization){
//     return res.status(401).send({message:'unauthorize access'});
//   }
//   const token = authorization.split(' ')[1];
//  try {
//   const decode = await admin.auth().verifyIdToken(token);
//   req.token_email = decode.email;
//    next();
//  } catch (error) {
//   console.log("Invalid token");
//    return res.status(401).send({message:'unauthorize access'});
//  }

// }

async function run() {
  try {
    await client.connect();
    const db = client.db("ArtLane_DB");
    const artWorksCollection = db.collection("Artworks");
    const favoritesCollection = db.collection("favorites");
    //ekhan theke suru

    // ------------------get all artworks--------------
    app.get("/artworks", async (req, res) => {
      const email = req.query.email;
      // const query = {};
      // if(email){
      //   if(email !== req.token_email){
      //     return res.status(403).send("forBidden Access")
      //   }
      //   query.userEmail = email;
      // }
      const query = email ? { userEmail: email } : {};
      const result = await artWorksCollection.find(query).toArray();
      res.send(result);
    });

    // ----------------post a art------------------
    app.post("/artworks", async (req, res) => {
      const newArt = req.body;
      const result = await artWorksCollection.insertOne(newArt);
      res.send(result);
    });

    // ----------------delete a specific art------------------
    app.delete("/artworks/:id", async (req, res) => {
      const id = req.params.id;
      const result = await artWorksCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });
    // ----------------update a specific art------------------
    app.put("/update-artworks/:id", async (req, res) => {
      const id = req.params.id;
      const updatedArt = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: updatedArt,
      };
      const result = await artWorksCollection.updateOne(query, update);
      res.send(result);
    });

    // ------------get top 6 featured artworks by recent time---------
    app.get("/featured-artworks", async (req, res) => {
      const cursor = artWorksCollection.find().sort({ time: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });
    // ------------get specific art by id ---------
    app.get("/artworks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await artWorksCollection.findOne(query);
      res.send(result);
    });

    // ---------------update likes-------------------
    app.put("/artworks/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const update = {
        $inc: { likes: 1 },
      };
      const result = await artWorksCollection.updateOne(query, update);
      res.send(result);
    });

    // -------------post to my favorite page------------
    app.post("/favorites", async (req, res) => {
      const newArt = req.body;
      const result = await favoritesCollection.insertOne(newArt);
      res.send(result);
    });
    // -------------get by to my favorite page------------
    app.get("/favorites", async (req, res) => {
      const favorite_by = req.query.favorite_by;
      const result = await favoritesCollection
        .find({ favorite_by: favorite_by })
        .toArray();
      res.send(result);
    });
    // -------------delete a art from  my favorite page------------
    app.delete("/favorites/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await favoritesCollection.deleteOne(query);
      res.send(result);
    });

    // -------------- get public visibility artworks--------------
    app.get("/artworks-public", async (req, res) => {
      const result = await artWorksCollection
        .find({ visibility: "Public" })
        .toArray();
      res.send(result);
    });

    // -------------search by title api
    app.get("/search-by-title", async (req, res) => {
      const title = req.query.title;
      const result = await artWorksCollection
        .find({ title: { $regex: title, $options: "i" } })
        .toArray();
      res.send(result);
    });
    // -------------search by title artist name
    app.get("/search-by-artist", async (req, res) => {
      const artist = req.query.artist;
      const result = await artWorksCollection
        .find({ userName: { $regex: artist, $options: "i" } })
        .toArray();
      res.send(result);
    });

    app.get("/filter-by-category", async (req, res) => {
      const category = req.query.category;
      const result = await artWorksCollection
        .find({ category: category })
        .toArray();
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("server connected at port- ", port);
});
