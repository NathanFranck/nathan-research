import { MongoClient } from "mongodb"

const databaseName = "nathan-research";

MongoClient.connect(
    `mongodb://localhost:27017/${databaseName}`,
    (err, db) => {
        if (err) throw err;
        console.log("Database created!");
        db.close();
    });

