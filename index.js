const express = require('express');
const app = express()
const cors = require('cors');
const port = process.env.PORT || 3000
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//Middleware
app.use(cors())
app.use(express.json())

// Database Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xue6gdd.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        //MongoDB
        const db = client.db("travelEase");
        const vehiclesCollection = db.collection('vehicles')
        const bookingsCollection = db.collection("bookings");
        const usersCollection = db.collection('user')

        // vehicles APIs
            app.get('/vehicles', async(req, res)=> {
                const result = await vehiclesCollection.find().toArray();
                res.send(result);
            })

            app.get('/vehicles/:id', async(req, res)=> {
                const id = req.params.id;
                const result = await vehiclesCollection.findOne({ _id: new ObjectId(id) });
                res.send(result);
            })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
    // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res)=> {
    res.send('TravelEase Server is Running...')
})

app.listen(port, ()=> {
    console.log(`Server running on port: ${port}`);
})