import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import typeDefs from "./src/typeDefs.js";
import resolvers from "./src/resolvers.js";
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();




// Connect to the DB and start the server
const start = async ()=>{
    const client = new MongoClient(process.env.MONGO_URL, { useNewUrlParser: true });
    try {
        // Connect to the MongoDB server
        await client.connect();

        // Get a reference to a database
        const db = client.db('TODOAPP');

        // Apollo Server Instance Creation
        const server = new ApolloServer({
            typeDefs,
            resolvers,
        });
        
        // startStandaloneServer Encapsulates with express middleware inside it
        const { url } = await startStandaloneServer(server, {
            context:({req}) =>{
                const accessToken = req.headers.authorization;
                const User = getUserFromToken({accessToken,db});
                return {db,User}
            },
            listen: { port: 4000 },
        });

        console.log(`🚀  Server ready at: ${url}`);

    } catch (error) {
        console.log(error);
    }
}

start();


