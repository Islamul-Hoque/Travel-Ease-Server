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
            //Home vehicles
            app.get('/vehicles', async(req, res)=> {
                const result = await vehiclesCollection.find().sort({createdAt: -1}).limit(6).toArray();
                res.send(result);
            })

            //Details vehicle
            app.get('/vehicle-details/:id', async(req, res)=> {
                const id = req.params.id;
                const result = await vehiclesCollection.findOne({ _id: new ObjectId(id) });
                res.send(result);
            })

            // All vehicles sorted by price
            app.get('/all-vehicles', async(req, res)=> {
                const result = await vehiclesCollection.find().sort({ pricePerDay: 1 }).toArray();
                res.send(result);
            })

            // Add a vehicle
            app.post('/add-vehicle', async(req, res)=> {
                const newVehicles = req.body
                const result = await vehiclesCollection.insertOne(newVehicles);
                res.send(result);
            })

            // My vehicles
            app.get('/my-vehicles', async(req, res)=> {
                const email = req.query.email;
                const query = {}
                if(email){
                    query.userEmail = email
                }
                const result = await vehiclesCollection.find(query).toArray();
                res.send(result);
            })

            // Update a vehicle
            app.patch('/my-vehicles/:id', async(req, res)=> {
                const id = req.params.id;
                const updatedVehicle = req.body;
                const query = { _id: new ObjectId(id) };
                const update = {
                    $set: { ...updatedVehicle }
                }
                const options = {};
                const result = await vehiclesCollection.updateOne(query, update, options);
                res.send(result);
            })

            // Delete a vehicle
            app.delete('/my-vehicles/:id', async(req, res)=> {
                const id = req.params.id;
                const result = await vehiclesCollection.deleteOne({ _id: new ObjectId(id) });
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