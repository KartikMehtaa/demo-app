import { createRequire } from "module";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Using import or export module
import express from "express";
import { MongoClient } from 'mongodb';
import bodyParser from 'body-parser';
import os from 'os';

import { publicIp, publicIpv4, publicIpv6 } from 'public-ip';

// // Using require
// const express = require("express");
// const { MongoClient } = require('mongodb');
// const bodyParser = require("body-parser");
// const os = require('os');


// For mongodb
const  mongoUrl= process.env.MONGO_URL; // Replace with mongodb server IP
const client = new MongoClient(mongoUrl); 

const db = client.db(process.env.MONGO_DB || "mydatabase"); // Name of your database
const collection = db.collection('mycollection'); // Name of your collection

// Database connection function
async function connectToMongoDB() {
    try {
      await client.connect();
      console.log('Connected to MongoDB server');
    } catch (error) {
      console.error('Error connecting to MongoDB Server:', error);
    }
  }
  
connectToMongoDB();

// await client.close(); // Close the connection

const app = express();
const PORT = process.env.PORT || 5000;

// Home page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Parse incoming requests with JSON payloads
app.use(express.json());
app.use(express.static('/')); // Serve static files from root directory also we can use 'public' directory

// Insert data to MongoDB server
app.post('/insertData', async (req, res) => {
    const data = req.body;

    try {
        // Check for duplicates
        const existingData = await collection.findOne({ email: data.email });

        if (existingData) {
            return res.send(' email already exists, user adding fail!!');
            // return res.status(400).send(' email already exists');
        }

        // Insert the data
        await collection.insertOne(data);
        res.status(200).send(' added successfully');
        //   console.log('User added successfully....')


    } catch (error) {
        // console.error('Error inserting data:', error);
        return res.status(500).send(' add Error');
    }
});

// Get data from MongoDB server
app.get('/fetchData', async (req, res) => {
    const data = await collection.find({}).limit(12).sort({ _id: -1 }).toArray()
    res.json(data);
    // console.log('User fetch successfully....')
});


// Find host and ip address
app.get('/hostinfo', async (req, res) => {

    const hostname = os.hostname(); // Get the server's hostname
    const networkInterfaces = os.networkInterfaces();
    let privateIp = '';

    // Find the private IP address
    for (const iface in networkInterfaces) {
        for (let i = 0; i < networkInterfaces[iface].length; i++) {
            if (networkInterfaces[iface][i].family === 'IPv4' && !networkInterfaces[iface][i].internal) {
                privateIp = networkInterfaces[iface][i].address;
                break;
            }
        }
        if (privateIp) break;
    }
    let publicIpAddress = await publicIpv4();

    const hostinfo = {
        hostname,
        privateIp,
        publicIpAddress
    };
    res.json(hostinfo);
});

app.listen(PORT, () => {
    console.log('Server is running on', PORT);
});