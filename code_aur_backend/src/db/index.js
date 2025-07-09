import mongoose from "mongoose";
import {DB_NAME} from '../constents.js'
import express from 'express'

const app = express()

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log(`MONGODB connected !! HOST: ${connectionInstance.connection.host}`);
    
    app.on('error', (error)=>{
      throw error
    })
    
  } catch (error) {
    console.log("MONGODB connection error", error)
    process.exit(1)
  }
}

export default connectDB