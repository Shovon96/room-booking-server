const express = require('express');
const cors = require('cors');
// const jwt = require('jsonwebtoken');
// const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;


//midleware 
app.use(cors())
app.use(express.json());
// app.use(cookieParser())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.riywk8u.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // collections
        const featuredCollections = client.db('hotel').collection('features');
        const roomsCollections = client.db('hotel').collection('rooms');
        const bookingCollections = client.db('hotel').collection('booking');

        // features card releted apis
        app.post('/features', async (req, res) => {
            const feature = req.body;
            const result = await featuredCollections.insertOne(feature);
            res.send(result)
        })

        app.get('/features', async (req, res) => {
            const cursor = featuredCollections.find();
            const result = await cursor.toArray()
            res.send(result)
        })

        // rooms rleted apis
        app.post('/rooms', async (req, res) => {
            const room = req.body;
            const result = await roomsCollections.insertOne(room);
            res.send(result)
        })

        app.get('/rooms', async (req, res) => {
            const cursor = roomsCollections.find();
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/rooms/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await roomsCollections.findOne(query)
            res.send(result);
        })

        // Booking releted apis
        app.post('/bookings', async (req, res) => {
            const data = req.body;
            const result = await bookingCollections.insertOne(data)
            res.send(result)
        })

        app.get('/bookings/:email', async (req, res) => {
            const email = req.params.email;
            // console.log(email)
            const query = { email: email };
            const cursor = bookingCollections.find(query);
            const result = await cursor.toArray()
            res.send(result)
        })

        // Delete One from database
        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingCollections.deleteOne(query);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hotel is running')
})

app.listen(port, () => {
    console.log(`Hotel server running port is ${port}`);
})