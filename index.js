const express = require('express');
require('dotenv').config()
const cors = require('cors')
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

// middleware
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())

// verify JWT
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }

    // Bearer Token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next();
    })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jaehzkc.mongodb.net/?retryWrites=true&w=majority`;

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
        // await client.connect();

        const instructorsCollection = client.db('Acoustica').collection('instructors');
        const classesCollection = client.db('Acoustica').collection('classes');
        const usersCollection = client.db('Acoustica').collection('users');
        const selectedCollection = client.db('Acoustica').collection('selected');
        const addClassCollection = client.db('Acoustica').collection('add-class');

        // JWT implementation
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '7d'
            })
            res.send({ token })
        })


        // if user is admin
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role === 'admin' };
            res.send(result)
        })

        // if user is instrcutor
        app.get('/users/instructor/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = { instructor: user?.role === 'instructor' };
            res.send(result)
        })


        // user related apis
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query)
            if (existingUser) {
                return res.send({ message: 'user already exists' })
            }
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })

        // get all users
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })

        // update user to admin
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        // update user to instructor
        app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'instructor'
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc)
            res.send(result)
        })



        // get all instructors 
        app.get('/instructors', async (req, res) => {
            const result = await instructorsCollection.find().toArray()
            res.send(result);
        })

        // get all classes
        app.get('/classes', async (req, res) => {
            const result = await classesCollection.find().toArray()
            res.send(result);
        })


        // CLAASS RELATED APIS


        // add my-selected to database
        app.post('/my-selected', async (req, res) => {
            const selected = req.body;
            const result = await selectedCollection.insertOne(selected)
            res.send(result);
        })

        // get my selected classes
        app.get('/my-selected', async (req, res) => {
            const result = await selectedCollection.find().toArray()
            res.send(result)
        })



        // INSTRUCTOR RELATED APIS
        app.post('/add-class', async (req, res) => {
            const newClass = req.body;
            const result = await addClassCollection.insertOne(newClass)
            res.send(result)
        })

        // get added classes
        app.get('/add-class', async (req, res) => {
            const result = await addClassCollection.find().toArray()
            res.send(result)
        })


        // get manage classes
        app.get('/manage-classes', async (req, res) => {
            const result = await addClassCollection.find().toArray()
            res.send(result)
        })


        // approve action
        app.patch('/approved-classes/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: 'approved'
                }
            }
            const result = await addClassCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })


        // Deny action
        app.patch('/denied-classes/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: 'denied'
                }
            }
            const result = await addClassCollection.updateOne(filter, updateDoc, options)
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
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});

