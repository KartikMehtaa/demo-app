import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname } from "path";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Using import or export module
import express from "express";
import mysql from "mysql2/promise";
import bodyParser from "body-parser";
import os from "os";

import { publicIp, publicIpv4, publicIpv6 } from "public-ip";

// For MySQL
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "mysql",
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || "appuser",
    password: process.env.MYSQL_PASSWORD || "apppassword",
    database: process.env.MYSQL_DATABASE || "mydatabase",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Database connection function
async function connectToMySQL() {
    try {
        const connection = await pool.getConnection();

        console.log("Connected to MySQL server");

        connection.release();
    } catch (error) {
        console.error("Error connecting to MySQL Server:", error);
    }
}

connectToMySQL();

const app = express();
const PORT = process.env.PORT || 5000;

// Home page
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// Parse incoming requests with JSON payloads
app.use(express.json());

app.use(express.static("/"));

// Insert data to MySQL server
app.post("/insertData", async (req, res) => {

    const data = req.body;

    try {

        // Check for duplicate email
        const [existingData] = await pool.execute(
            "SELECT id FROM mycollection WHERE email = ?",
            [data.email]
        );

        if (existingData.length > 0) {
            return res.send("email already exists, user adding fail!!");
        }

        // Insert data into MySQL
        await pool.execute(
            "INSERT INTO mycollection (name, email) VALUES (?, ?)",
            [data.name, data.email]
        );

        res.status(200).send("added successfully");

    } catch (error) {

        console.error("Error inserting data:", error);

        return res.status(500).send("add Error");
    }
});

// Get data from MySQL server
app.get("/fetchData", async (req, res) => {

    try {

        const [data] = await pool.execute(
            "SELECT * FROM mycollection ORDER BY id DESC LIMIT 12"
        );

        res.json(data);

    } catch (error) {

        console.error("Error fetching data:", error);

        res.status(500).send("Error fetching data");
    }
});

// Find host and IP address
app.get("/hostinfo", async (req, res) => {

    const hostname = os.hostname();

    const networkInterfaces = os.networkInterfaces();

    let privateIp = "";

    // Find the private IP address
    for (const iface in networkInterfaces) {

        for (let i = 0; i < networkInterfaces[iface].length; i++) {

            if (
                networkInterfaces[iface][i].family === "IPv4" &&
                !networkInterfaces[iface][i].internal
            ) {

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

    console.log("Server is running on", PORT);

});