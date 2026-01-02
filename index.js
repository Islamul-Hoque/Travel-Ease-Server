const express = require('express');
const app = express()
const cors = require('cors');
const port = process.env.PORT || 3000
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//Middleware
app.use(cors())
app.use(express.json())

// Database 
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
        // await client.connect();

        //MongoDB
        const db = client.db("travelEase");
        const vehiclesCollection = db.collection('vehicles')
        const bookingsCollection = db.collection("bookings")

        // vehicles APIs
            //Home vehicles
            app.get('/vehicles', async(req, res)=> {
                const result = await vehiclesCollection.find().sort({createdAt: -1}).limit(4).toArray();
                res.send(result);
            })

            //Details vehicle
            app.get('/vehicle-details/:id', async(req, res)=> {
                const id = req.params.id;
                const result = await vehiclesCollection.findOne({ _id: new ObjectId(id) });
                res.send(result);
            })

            // All vehicles sorted by price
            // app.get('/all-vehicles', async (req, res) => {
            //     const sortOrder = req.query.sortOrder;
            //     let sort = {};

            //     if (sortOrder === "Low to High") {
            //         sort.pricePerDay = 1;
            //     }
            //     else if (sortOrder === "High to Low") {
            //         sort.pricePerDay = -1;
            //     }
            //     const result = await vehiclesCollection.find().sort(sort).toArray();
            //     res.send(result);
            // });

// Distinct filters route


// All vehicles route
app.get('/all-vehicles', async (req, res) => {
  const search = req.query.search || "";
  const sort = req.query.sort || "date-desc";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 8;
  const skip = (page - 1) * limit;

  const filterCategory = req.query.category || "";
  const filterLocation = req.query.location || "";

  // Query builder
  const query = {
    status: "active",
    $and: [
      filterCategory ? { category: { $regex: filterCategory, $options: "i" } } : {},
      filterLocation ? { location: { $regex: filterLocation, $options: "i" } } : {},
      {
        $or: [
          { vehicleName: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } }
        ]
      }
    ]
  };

  // Sorting map
  const sortMap = {
    "price-asc": { pricePerDay: 1 },
    "price-desc": { pricePerDay: -1 },
    "date-asc": { createdAt: 1 },
    "date-desc": { createdAt: -1 }
  };

  try {
    const total = await vehiclesCollection.countDocuments(query);
    const result = await vehiclesCollection
      .find(query)
      .sort(sortMap[sort])
      .skip(skip)
      .limit(limit)
      .toArray();

    res.send({ total, page, limit, data: result });
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch vehicles" });
  }
});


app.get('/vehicle-filters', async (req, res) => {
  try {
    const all = await vehiclesCollection.find({ status: "active" }).toArray();

    const categories = [...new Set(all.map(v => v.category).filter(Boolean))];
    const locations = [...new Set(all.map(v => v.location).filter(Boolean))];

    res.send({ categories, locations });
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch filters" });
  }
});






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

        // bookings APIs
            // Add a booking
            // app.post('/my-bookings', async(req, res)=> {
            //     const newBooking = req.body
            //     // Duplicate booking check
            //     const query = {
            //         vehicleId: newBooking.vehicleId,
            //         userEmail: newBooking.userEmail,
            //     }
            //     const alreadyBooked = await bookingsCollection.findOne(query);  
            //     if(alreadyBooked){
            //         return res.send({ message: 'You have already booked this vehicle' });
            //     } else{
            //         const result = await bookingsCollection.insertOne(newBooking);
            //         res.send(result);
            //     }
            // })

// Get all vehicles for booking
app.get('/book-vehicles', async (req, res) => {
  const result = await vehiclesCollection.find({ status: "active" }).toArray();
  res.send(result);
});

// Add a booking
app.post('/book-vehicles/book', async (req, res) => {
  const newBooking = req.body;
  const query = { vehicleId: newBooking.vehicleId, userEmail: newBooking.userEmail };
  const alreadyBooked = await bookingsCollection.findOne(query);
  if (alreadyBooked) {
    return res.send({ message: 'You have already booked this vehicle' });
  }
  const result = await bookingsCollection.insertOne(newBooking);
  res.send(result);
});

   // Get all bookings
    app.get('/my-bookings', async(req, res)=> {
        const email = req.query.email;
        const query = {}
        if(email){
            query.userEmail = email
        }
        const result = await bookingsCollection.find(query).sort({ createdAt: 1 }).toArray();
        res.send(result);
    })

app.delete("/my-bookings/:id", async (req, res) => {
  const id = req.params.id;
  const result = await bookingsCollection.deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 1) {
    res.send({ success: true });
  } else {
    res.status(404).send({ message: "Booking not found" });
  }
});



        // await client.db("admin").command({ ping: 1 });
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