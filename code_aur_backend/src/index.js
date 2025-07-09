import dotenv from 'dotenv'
import connectDB from './db/index.js';
import { app } from './app.js';

dotenv.config({
  path: './.env'
})

connectDB()
.then(()=>{
  app.listen(process.env.PORT || 8000, ()=>{
    console.log(`server is running port on ${process.env.PORT}`);
    
  })
  app.on('error', (error)=>{
    throw error
  })
})
.catch(error => console.log("MONGODB connection error", error))



// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

//     app.on('error', (error) => {
//       console.error('App Error:', error);
//       throw error;
//     });

//     app.listen(process.env.PORT || 8000, () => {
//       console.log(`App listening on port ${process.env.PORT || 8000}`);
//     });

//   } catch (error) {
//     console.error('Connection Error:', error);
//     throw error;
//   }
// })();
