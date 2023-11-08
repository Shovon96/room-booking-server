const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;


//midleware 
app.use(
    cors({
        origin: [
            "http://localhost:5173",
        ],
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.riywk8u.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.post("/jwt", async (req, res) => {
    const user = req.body;
    console.log(process.env.ACCESS_TOKEN_SECRET);
    try {
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "1h",
        });
        res
            .cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            })
            .send({ success: true });
    } catch (error) {
        console.log(error)
    }
});
app.post("/logout", async (req, res) => {
    res
        .clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true });
});

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    console.log("value of cookie in middleware", token);
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized User' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        // error
        if (err) {
            console.log(err);
            return res.status(401).send({ message: "Unauthorized User" })
        }
        // if token is valid then it would be decoded
        console.log("value in the token", decoded);
        req.user = decoded;
        next()
    })
}
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // collections
        const featuredCollections = client.db('hotel').collection('features');
        const roomsCollections = client.db('hotel').collection('rooms');
        const bookingCollections = client.db('hotel').collection('booking');
        const reviewsCollections = client.db('hotel').collection('reviews');

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

        app.get('/sort', async (req, res) => {
            const {sort} = req.query;
            if (sort) {
                const result = await roomsCollections.find().sort({ price: -1 }).toArray()
                res.send(result)
                return
            }
            res.send('invalid request')
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

        app.get('/bookings/:email', verifyToken, async (req, res) => {
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

        // reviews releted apis
        app.post('/reviews', async (req, res) => {
            const room = req.body;
            const result = await reviewsCollections.insertOne(room);
            res.send(result)
        })

        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollections.find();
            const result = await cursor.toArray()
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